
var mysql      = require('mysql');
var sqlQueries = require('./sql_queries');
var log = require('./log');
var dbInfo = {
  host     : 'localhost',
  user     : 'QueueUser',
  password : 'N3onIc3d',
  database : 'QueueDB',
  dateStrings : true
};
var connection = mysql.createConnection(dbInfo);


var addUserTesting = false;
var getOrganizationsTesting = false;
var addOrganizationTesting = false;
var addUserToOrgTesting = false;
var searchOrganizaitonsTesting = false;
var removeUserFromQueueTesting = true;

testUser = {
	username : 'testUser',
	password : 'foobar',
	email_address : 't@t.com'
}

realOrg = {
	organization_name : "testOrg"
}

testOrganization = {
	organization_name : "The Testing Org",
	organization_password : "password",
	organization_owner : testUser
}

if(addUserTesting){
    console.log("Attempting to add user %j", testUser);
	sqlQueries.addUser(dbInfo, testUser, function(err, rows, fields){
		if(err){
			console.log("error in test addUser: "+err);
		}
		console.log(rows);
	});
}

if(getOrganizationsTesting){
	console.log("Attempting to get all organizations that " + testUser.username + " is a part of.");
	sqlQueries.getOrganizations(dbInfo, testUser.username, function(err, rows, field){
		if(err){
			console.log("Error in getOrganizationsTesting "+err);
		}
		console.log(rows);
	});
}

if(addOrganizationTesting){
	console.log("Attempting to add new organization " + testOrganization.organization_name + " with " + testUser.username + " as the owner");
	sqlQueries.addOrganization(dbInfo, testOrganization, function(err, rows, fields){
		if(err){
			console.log("Error in addOrganizationTesting " + err);
		}
		console.log(rows);
	});
}

if(addUserToOrgTesting){
	console.log("Attempting to add user " +testUser.username + " as a memeber of " + realOrg.organization_name);
	

	sqlQueries.addUserToOrg(dbInfo, testUser, realOrg, 0, function(err,rows,field){
		if(err){
		console.log("Error in addUserToOrgTesting " + err);
		}
		console.log(rows);
	});
	
}


if(searchOrganizaitonsTesting){
	var search = "test";
	log.info("Attempting to search for organizations with the name " + search);

	sqlQueries.searchOrganizaitons(dbInfo, search, function(err, rows, fields){
		if(err){
			log.fail("Error trying to search for organizations. "+ err);
			return;
		}
		for(var i = 0; i<rows.length; i++){
			log.success(rows[i].organization_name);
		}

	});
}

if(removeUserFromQueueTesting){
	var username = "sagar";
	var org_name = "ZBT";

	sqlQueries.removeUserFromQueue(dbInfo, username, org_name, function(err, rows, fields){
		if(err){
			log.fail(err);
			return;
		}
		
	});
}








