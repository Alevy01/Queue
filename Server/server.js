var express = require('express');
var hash = require('./pass').hash;
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mysql = require('mysql');
var sqlQueries = require('./sql_queries');
var fs = require('fs');
var multer  = require('multer');
var SessionStore = require('express-mysql-session');
var log = require('./log');

var app = express();


var dbInfo = {
  host     : 'localhost',
  user     : 'QueueUser',
  password : 'N3onIc3d',
  database : 'QueueDB',
  dateStrings : true
}


app.use(cookieParser('shhhh, very secret'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

var sessionStore = new SessionStore(dbInfo);

app.use(session({
    secret: 'shhhh, very secret',
    store: sessionStore,
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 604800000 }
})); 

function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    log.fail("Access denied due to not being logged in");
    req.session.error = 'Access denied!';
    res.json({error_message: "Access denied!", cookieValid : false});
    return;
  }
}


function authenticate(name, pass, fn) {
    
    var userSelectStatement = "select * from users where username = '" + name+"'";
    var connection = mysql.createConnection(dbInfo);
    connection.query(userSelectStatement, function(err, rows, fields){
        if (err) throw err;
        if(rows.length <1){
            return fn(new Error('cannot find user'));
        }
        var user = rows[0];
        hash(pass, user.salt, function(err, hash){
            if (err) return fn(err);
            if (hash.toString('hex') == user.hash_code) return fn(null, user);
            fn(new Error('invalid password'));
        })
    });
      connection.end();
}

function authenticateOrganization(organization, fn) {
  var orgSelectionStatement = "SELECT * FROM organizations WHERE organization_name = '" +organization.organization_name+"'";
  var conn = mysql.createConnection(dbInfo);
  conn.query(orgSelectionStatement, function(err, rows, fields){
    if(err){ 
      throw err;
    }
    if(rows.length < 1){
      return fn(new Error('cannot find organization'));
    }
    var org = rows[0];
    hash(organization.organization_password, org.organization_salt, function(err, hash){
      if(err) 
        return fn(err);
      if(hash.toString('hex') == org.organization_hash_code){
        return fn(null, org);
      }
      else
        fn(new Error('Invalid Password'));
    })
  });
  conn.end();
}

app.get('/cookiecheck', function(req, res) {
    if (req.session.user) {
        res.json({
          cookieValid : true
        });
  } else {
        res.json({
          cookieValid : false
        });
  }
});


app.post('/register', function(req, res){

    var user = 
    {
      username : req.body.username,
      password : req.body.password,
      email_address : req.body.email_address
    };
    
    sqlQueries.addUser(dbInfo, user, function(err, rows, fields){
        log.info("Attempting to add user: " + user.username);
        if(err)
        {
            log.fail("Error trying to add user. " + err)
            res.json({success: 'false', errorMessage: 'User already exists, maybe.'});
            return;
        }
        req.session.regenerate(function(){
            req.session.user = user
            req.session.success = 'Authenticated as ' + user.username
            + ' click to <a href="/logout">logout</a>. '
            + ' You may now access <a href="/restricted">/restricted</a>.';
            log.success("New user '%s'. Welcome!", user.username)
            res.json({success: 'true'})
        });
    });
});

app.post('/login', function(req, res){
  authenticate(req.body.username, req.body.password, function(err, user){
    if(user)
    {
      // Regenerate session when signing in
      // to prevent fixation
      req.session.regenerate(function(){
        // Store the user's primary key
        // in the session store to be retrieved,
        // or in this case the entire user object
        req.session.user = user;
        req.session.success = 'Authenticated as ' + user.username
          + ' click to <a href="/logout">logout</a>. '
          + ' You may now access <a href="/restricted">/restricted</a>.';
        res.json({success : 'true' });
        log.success("Auth success for '%s'", user.username);
      });
    } 
    else 
    {
      req.session.error = 'Authentication failed, please check your '
        + ' username and password.';
      res.json({success : 'false'});
      log.fail("Auth failed for %s. %s", req.body.username, err);
    }
  });
});

app.get('/getOrganizations', restrict, function(req, res){
  log.info("Attempting to get all organizations the user is a memeber of.");
  //log.fail(req.session.user.username);
  sqlQueries.getOrganizations(dbInfo, req.session.user.username, function(err, userOrgs){
    if(err){
      res.json({
        success : false,
        errorMessage : "Error getting the organizations in getOrganizations " + err
      });
      return;
    }
    res.json({
      success : true,
      organizations : userOrgs
    });
  });
});

app.post('/addNewOrganization', restrict, function(req, res){
  log.info("Attempting to create a new organization for the user.");
  if(!req.body.organization_password){
    res.json({
      success : false,
      errorMessage : "No Password set in /addNewOrganization"
    });
    log.fail("Error trying to add new organization, no password set. "+err);
    return;
  }
  if(!req.body.organization_name){
    res.json({
      success : false,
      errorMessage : "No organization name set in /addNewOrganization"
    });
    log.fail("Error trying to add new organization, no organization name set. "+err);
    return;
  }
  
  var organization = {
    organization_name : req.body.organization_name,
    organization_password : req.body.organization_password,
    organization_owner : req.session.user
  }

  sqlQueries.addOrganization(dbInfo, organization, function(err, newOrg){
    if(err){
      res.json({
        success : false,
        errorMessage : "An Organization with that name already exists "+err
      });
      log.fail("Error trying to add new organization, that organization already exists. "+err);
      return;
    }
    sqlQueries.addUserToOrg(dbInfo, req.session.user, organization, 1, function(err, rows){
      if(err)
      {
        res.json({
          success : false,
          errorMessage : err
        });
        log.fail("Unspecified error trying to add user to organization "+err);
        return;
      }

      res.json({
        success : true,
        newOrganization : newOrg
      });
      log.success("Success creating new organization.");
    });
  });
});


app.post('/addUserToOrganization', restrict, function(req, res){
  organization = {
    organization_name : req.body.organization_name,
    organization_password : req.body.organization_password
  }

  authenticateOrganization(organization, function(err, rows){
    if(err)
    {
      log.fail("Error authenticating organization password, please try again.");
      res.json({
        success : false, 
        errorMessage : "Wrong password."
      });
      return;
    }
    sqlQueries.addUserToOrg(dbInfo, req.session.user, organization, 0, function(err, rows){
      if(err){
        log.fail("Error trying to add user to organization. " + err);
        res.json({
          success : false,
          errorMessage : err
        });
        return;
      }
      
      res.json({
        success : true,
        row : rows
      });
    })
  });
});

//If the user removing themself from an organization is the owner, delete the organization.
//TODO: Allow users to change ownership
app.post('/removeUserFromOrganization', restrict, function(req, res){
  var user = req.session.user;
  sqlQueries.removeUserFromOrg(dbInfo, user, req.body.organization_name, function(err, rows){
    if(err){
      log.fail("Error trying to remove user from organization. "+err);
      res.json({
        success : false,
        errorMessage : err
      });
      return;
    }

    res.json({
      success :true,
      row : rows
    });
    
    log.success("Success removing user: "+user.username + " from organization "+ req.body.organization_name);
  });
});


app.get('/logout', function(req, res){
  // destroy the user's session to log them out
  // will be re-created next request
  req.session.destroy(function(){
    res.redirect('/login');
  });
});
app.get('/login', function(req, res){
  res.send('login');
});

app.get('/browseOrganizations', restrict, function(req, res){
  var user = req.session.user;
  sqlQueries.getAllOrgs(dbInfo, function(err, rows){
    if(err){
      log.fail("Error Trying to retrieve all organizations "+err);
      res.json({
        success : false,
        errorMessage : "Error retrieving all organizations."
      });
      return;
    }
    res.json({
      success : true,
      orgs : rows
    });
    log.success("Success selecting all organizations.");

  });
});

app.post('/addUserToQueue', restrict, function(req, res){
  var user = req.session.user;
  sqlQueries.addUserToQueue(dbInfo, user, req.body.org_name, function(err, rows){
    if(err){
      log.fail("Error trying to add user to queue. " + err);
      res.json({
        success : false,
        errorMessage : "Error adding user to queue."
      });
      return;
    }
    log.success("Success adding user to queue.");
    res.json({
      success : true
    });
  });
});

app.post('/removeUserFromQueue', restrict, function(req, res){
  var user = req.body.username;
  var orgName = req.body.org_name;
  sqlQueries.removeUserFromQueue(dbInfo, user, orgName, function(err, rows){
    if(err){
      log.fail("Error removing user from queue. " + err);
      res.json({
        success : false,
        errorMessage : "Error removing user from queue."
      });
      return;
    }
    log.success("Success removing user from queue.");
    res.json({
      success : true
    });
  });
});

app.get('/getUsersInQueue/:organization', restrict, function(req, res){
  var orgName = req.params.organization;

  sqlQueries.getUsersInQueue(dbInfo, orgName, function(err, rows){
    if(err){
      log.fail("Error getting users in queue. "+ err);
      res.json({
        success : false,
        error_message : "Error getting user in queue."
      });
      return;
    }
    log.success("Success getting users from queue.");
    res.json({
      success : true,
      users : rows
    });
  });
});

app.post('/activateQueue', restrict, function(req, res){
  var orgName = req.body.org_name;
  sqlQueries.makeQueueActive(dbInfo, orgName, function(err, rows){
    if(err){
      log.fail("Error making queue Active. " + err);
      res.json({
        success : false,
        errorMessage : "Error making queue active."
      });
      return;
    }
    log.success("Success activating queue.");
    res.json({
      success : true
    });

  });
});

app.post('/deactivateQueue', restrict, function(req, res){
  var orgName = req.body.org_name;
  sqlQueries.makeQueueInactive(dbInfo, orgName, function(err, rows){
    if(err){
      log.fail("Error making queue inactive. " + err);
      res.json({
        success : false,
        errorMessage : "Error making queue inactive."
      });
      return;
    }
    log.success("Success deactivating queue.");
    res.json({
      success : true
    });

  });

});

app.post('/makeUserAdmin', restrict, function(req,res){
  var user = req.session.user;
  var makeAdmin = req.body.userToMakeAdmin;
  var org = req.body.organization;
  sqlQueries.makeUserAdmin(dbInfo, user, makeAdmin, org, function(err, rows){
    if(err){
      log.fail("Error making " + makeAdmin + " an admin. "+ err);
      res.json({
        success : false,
        errorMessage : "Error making user an admin."
      });
      return;
    }

    log.success("Success making "+ makeAdmin + " an admin.");
    res.json({
      success : true
    });
  });
});


app.post('/removeAdmin', restrict, function(req, res){
  var user = req.session.user;
  var takeAdmin = req.body.userToRemoveAdmin;
  var org = req.body.organization;
  sqlQueries.removeAdmin(dbInfo, user, takeAdmin, org, function(err, rows){
      
    if(err){
      log.fail("Error removing " + takeAdmin + " as an admin. "+ err);
      res.json({
        success : false,
        errorMessage : "Error removing user as an admin."
      });
      return;
    }

    log.success("Success removing "+ takeAdmin + " as an admin.");
    res.json({
      success : true
    });
  });
});

app.get('/isUserAdmin/:org_name', restrict, function(req,res){
  var username = req.session.user.username;
  var org = req.params.org_name;

  sqlQueries.userIsAdmin(dbInfo, username, org, function(err, rows){
    if(err){
      log.fail("Error accessing if the user is admin.");
      res.json({
        success : false,
        errorMessage : "Error accessing if user is admin"
      });
      return;
    }
    log.success("Sucess accessing if user is admin.");
    res.json({
      success : true,
      is_admin : rows[0]
    });
  });

});

app.get('/searchOrganizations/:search_name', restrict, function(req, res){
  
  var search = req.params.search_name;

  sqlQueries.searchOrganizaitons(dbInfo, search, function(err, Orgs){
    if(err){
      log.fail("Error searching for organization " + err);
      res.json({
        success : false,
        errorMessage : "Error searching for organization."
      });
      return
    }

    log.success("Success searching for organization.");
    res.json({
      success : true,
      orgs : Orgs
    });

  });

});



var portNumber = 8000;
app.listen(portNumber);
console.log("Queue Server started on port: "+portNumber);

