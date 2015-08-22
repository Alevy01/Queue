var mysql = require('mysql');
var hash = require('./pass').hash;
var log = require('./log');

module.exports={
	//User must have username, password, and email_address defined for addition to database.
	addUser: function(dbInfo, user, fn)
	{
		if(!user.username){
			fn(new Error("no username set in addUser"));
			return;
		}
		if(!user.password){
			fn(new Error("no password set in addUser"));
			return;
		}
		if(!user.email_address){
			fn(new Error("no email address set in addUser"));
			return;
		}
		
		hash(user.password, '-m0b=D4lZZb4ZJp %4E|YxZTfsvuJf1ngDtlG XZ~jHLi8RjXI', function(err, hash){
			if(err) fn(err);
			user.salt = '-m0b=D4lZZb4ZJp %4E|YxZTfsvuJf1ngDtlG XZ~jHLi8RjXI';
			user.hash_code = hash.toString('hex');
			var queryString = "INSERT INTO users (username, email, salt, hash_code"+") VALUES ('"+user.username+"', '" +user.email_address +"', '" +user.salt +"', '"+user.hash_code+"');";
			var conn = mysql.createConnection(dbInfo);
			conn.query(queryString, function(err, rows, fields){
				fn(err, rows, fields);
			});
			conn.end();
		});
	},

	getOrganizations: function(dbInfo, username, fn)
	{
		if(!username)
		{
			fn(new Error("No username set in getOrganizations"));
			return;
		}
		var queryString = "SELECT organization_name FROM user_organization inner join organizations on organizations.organization_id = user_organization.organization_id WHERE username = '"+username+"';";
		var conn = mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			//log.fail("ROWS : " + rows);
			if(err) {
				fn(err);
				return;
			}
			fn(err, rows);
		});
		conn.end();
	},

	addOrganization: function(dbInfo, organization, fn)
	{
		var queryString = "SELECT * FROM organizations WHERE organization_name = '"+organization.organization_name+"';";
		var conn = mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			if(err){
				fn(err);
				return;
			}
			if(rows.length != 0) 
				return fn(new Error("There is an organization with this name already."));
		});
		conn.end();
		hash(organization.organization_password, 'WIV+Uq+6*N9 fG~EHuCx byeW=oYOAT', function(err, hash){
			if(err) fn(err);
			organization.salt = 'WIV+Uq+6*N9 fG~EHuCx byeW=oYOAT';
			organization.hash_code = hash.toString('hex');

			var queryString = "INSERT INTO organizations (organization_name, organization_salt, organization_hash_code, organization_owner, is_queue_active"+") VALUES ('"+organization.organization_name+"', '"+organization.salt+"', '"+organization.hash_code+"', '"+organization.organization_owner.username+"', '0');";
			var conn = mysql.createConnection(dbInfo);
			conn.query(queryString, function(err, rows, fields){
				fn(err, rows, fields);
			});
			conn.end();
		});
	},

	addUserToOrg : function(dbInfo, user, org, creator, fn)
	{
		var conn = mysql.createConnection(dbInfo);
		var queryString = "SELECT * FROM user_organization WHERE username = '"+user.username+"' AND organization_id = (SELECT organization_id FROM organizations where organization_name = '"+org.organization_name+"')";
		conn.query(queryString, function(err, rows, fields){
			if(rows.length != 0){
				return fn(new Error("This user is already a member of this organization."));
			}
			else{
				var queryString = "INSERT INTO user_organization (username, organization_id, organization_owner, is_admin) VALUES ('"+user.username+"', (SELECT organization_id FROM organizations where organization_name = '"+org.organization_name+"'), '"+creator+"', '"+creator+"')";
				conn.query(queryString, function(err, rows, fields){
				if(err)
				{	
					console.log(err);
					return err;
				}
				fn(err, rows);
				});
			}
			conn.end();
		});	
	},

	removeUserFromOrg : function(dbInfo, user, org_name, fn)
	{
		var queryString = "SELECT * FROM organizations WHERE organization_name = '"+org_name+"';";
		var conn = mysql.createConnection(dbInfo);
		
		conn.query(queryString, function(err, rows, fields){
			if(err){
				log.fail("Error getting the owner from the organization "+err);
				return err;
			}

			var org = rows[0];
			// If the owner is deleting the table then remove all users from user_org table and then delete org from organizaitons table
			if(org.organization_owner == user.username){
				var queryString = "SELECT * FROM user_organization WHERE organization_id = (SELECT organization_id FROM organizations WHERE organization_name = '"+org_name+"');";
				conn.query(queryString, function(err, rows, fields){
					if(err){
						log.fail("Error selecting users from organization to remove them "+err);
						return err;
					}
					else{
						var members = rows;
						for(var i = 0; i<members.length; i++){
							var queryString = "DELETE FROM user_organization WHERE username = '"+members[i].username+"' and organization_id = (SELECT organization_id FROM organizations WHERE organization_name = '"+org_name+"');";
							conn.query(queryString, function(err,rows,fields){
								if(err){
									log.fail("Error deleting user from user_organization table. "+err);
									return err;
								}		
							});
							
						}
						var queryString = "DELETE FROM organizations WHERE organization_name = '"+org.organization_name+"';";
							conn.query(queryString, function(err,rows,fields){
								if(err){
									log.fail("Error deleting organization from the organization table. "+ err);
									return err;
								}
								conn.end();
							});
					}
					fn(err, rows);
				});
			}
			else{
				var queryString = "DELETE FROM user_organization WHERE username = '"+user.username+"' and organization_id = (SELECT organization_id FROM organizations WHERE organization_name = '"+org_name+"');";
				conn.query(queryString, function(err,rows, fields){
					if(err){
						log.fail("Could not delete user from organization "+err);
						return err;
					}
					fn(err,rows);
					conn.end();
				});
			}
		});
	},


	getAllOrgs : function(dbInfo, fn){
		var queryString = "SELECT * FROM organizations;";
		var conn = mysql.createConnection(dbInfo);

		conn.query(queryString, function(err, rows, fields){
			if(err){
				log.fail("Error selecting all organizations "+ err);
				return err;
			}
			 fn(err, rows);
		});

		conn.end();
	},

	//TODO: Add function that only allows user to be added to a queue if they are not already in it.
	addUserToQueue : function(dbInfo, user, org_name, fn){

		var queryString = "SELECT * FROM queue WHERE organization_id = (SELECT organization_id FROM organizations WHERE organization_name = '"+org_name+"') AND username = '"+user.username+"';";
		var conn = mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			if(rows.length > 0){
				return fn(new Error("This user is already in the queue of this organization."));
			}
			else
			{
				var queryString = "SELECT * FROM queue WHERE organization_id = (SELECT organization_id FROM organizations WHERE organization_name = '"+org_name+"');";
				conn.query(queryString, function(err,rows, fields){
					if(err){
						log.fail("Error Selecting queue from db " + err);
						return err;
					}
					var queue = rows;
					// for(var i = 0; i<queue.length; i++){
					// 	log.debug("QUEUE: "+ i + " " + queue[i] + " " + queue[i].organization_id);
					// }
					// log.debug(queue + " " + queue.length);
					var queryString = "INSERT INTO queue (username, organization_id, queue_id) VALUES ('"+user.username+"', (SELECT organization_id FROM organizations WHERE organization_name = '"+org_name+"'), '"+(queue.length+1)+"');";
					conn.query(queryString, function(err,rows,fields){
						if(err){
							log.fail("Error trying to add user to the queue. "+ err);
							return err;
						}
						fn(err, rows);
						conn.end();
					});	
				});
			}
		});

	},

	removeUserFromQueue : function(dbInfo, username, org_name, fn){
		var is_admin;
		var queue_id;
		

		var queryString = "SELECT queue_id FROM queue WHERE username = '"+username+"' AND organization_id = (SELECT organization_id FROM organizations WHERE organization_name = '"+org_name+"');";
		var conn = mysql.createConnection(dbInfo);
		conn.query(queryString, function(err, rows, fields){
			if(err){
				log.fail("Error selecting queue_id from user.");
				return err;
			}
			else{
				queue_id = rows[0]['queue_id'];
				var queryString = "DELETE FROM queue WHERE organization_id = (SELECT organization_id FROM organizations WHERE organization_name = '"+org_name+"') AND queue_id = '"+queue_id+"'";
				var conn = mysql.createConnection(dbInfo);
				conn.query(queryString, function(err, rows, fields){
					if(err){
						log.fail("Error deleting user from queue.");
						return err;
					}
					else{
						var queryString = "SELECT * FROM queue WHERE organization_id = (SELECT organization_id FROM organizations WHERE organization_name = '"+org_name+"')";
						var conn = mysql.createConnection(dbInfo);
						conn.query(queryString, function(err, rows, fields){
							if(err){
								log.fail("Error selecting all users in queue");
								return err;
							}
							else{
								for(i = queue_id+1; i<rows.length+(queue_id+1); i++){
									var queryString = "UPDATE queue SET queue_id = '"+(i-1)+"' WHERE queue_id = '"+i+"'";
									log.debug(queryString);
									var conn = mysql.createConnection(dbInfo);
									conn.query(queryString, function(err, rows, fields){
										if(err){
											log.fail("Error updating user queue position.");
											return err;
										}
									});
								}

								fn(err,rows);
							}
						});
					}	
				});
			}
			conn.end();
		});
	},

	makeUserAdmin : function(dbInfo, user, userToMakeAdmin, org, fn){
		var queryString = "SELECT * FROM user_organization WHERE username = '"+user.username+"' AND organization_id = (SELECT organization_id FROM organizations WHERE organization_name = '"+org+"');";
		var conn = mysql.createConnection(dbInfo);

		conn.query(queryString, function(err, rows, fields){
			if(err){
				log.fail("Error making "+userToMakeAdmin+" an admin. "+ err);
				return err;
			}

			var curUser = rows[0];
			if(!curUser.is_admin){
				log.fail("User is not an admin, so they cannot make user an admin.");
				return fn(new Error("This user is not an admin to make others admins."));
			}
			else
			{
				var queryString = "UPDATE user_organization SET is_admin = '1' WHERE username = '"+userToMakeAdmin+"' AND organization_id = (SELECT organization_id FROM organizations WHERE organization_name = '"+org+"');";
				conn.query(queryString, function(err, rows, fields){
					if(err){
						log.fail("Error updating user to make admin.");
						return err;
					}
				});
			}
			fn(err, rows);
			conn.end();
		});
	},

	removeAdmin : function(dbInfo, user, removeFrom, org, fn){
		var queryString = "SELECT * FROM user_organization WHERE username = '"+user.username+"' AND organization_id = (SELECT organization_id FROM organizations WHERE organization_name = '"+org+"');";
		var conn = mysql.createConnection(dbInfo);

		conn.query(queryString, function(err, rows, fields){
			if(err){
				log.fail("Error removing "+userToMakeAdmin+" as an admin. "+ err);
				return err;
			}

			var curUser = rows[0];
			if(!curUser.is_admin){
				log.fail("User is not an admin, so they cannot change admins.");
				return fn(new Error("This user is not an admin to change others admins."));
			}
			else
			{
				var queryString = "SELECT * FROM user_organization WHERE username = '"+removeFrom+"' AND organization_id = (SELECT organization_id FROM organizations WHERE organization_name = '"+org+"');";
				conn.query(queryString, function(err, rows, fields){
					if(err){
						log.fail("Error selecting user to remove. "+err);
						return err;
					}
					if(rows[0].organization_owner){
						log.fail("Cannot remove the organization owner as an admin.");
						return fn(new Error("Cannot remove the organization owner as an admin."));
					}
					else{
						var queryString = "UPDATE user_organization SET is_admin = '0' WHERE username = '"+removeFrom+"' AND organization_id = (SELECT organization_id FROM organizations WHERE organization_name = '"+org+"');";
						conn.query(queryString, function(err, rows, fields){
							if(err){
								log.fail("Error removing user from admin.");
								return err;
							}
							fn(err, rows);
							conn.end();
						});
					}
				});

			}
			
		});
	},

	searchOrganizaitons : function(dbInfo, search, fn){
		var queryString = "SELECT * FROM organizations WHERE organization_name LIKE '%"+search+"%';";
		var conn = mysql.createConnection(dbInfo);

		conn.query(queryString, function(err, rows,fields){
			if(err){
				log.fail("Error searching for organizations " + err);
				return err;
			}
			fn(err, rows);
			conn.end();
		});
	},

	makeQueueActive : function(dbInfo, org_name, fn){
		var queryString = "UPDATE organizations SET is_queue_active = TRUE WHERE organization_name = '"+org_name+"'";
		var conn = mysql.createConnection(dbInfo);

		conn.query(queryString, function(err, rows, fields){
			if(err){
				log.fail("Error making organization queue active. " + err);
				return err;
			}
			fn(err, rows);
			conn.end();
		});
	},

	makeQueueInactive : function(dbInfo, org_name, fn){
		var queryString = "UPDATE organizations SET is_queue_active = FALSE WHERE organization_name = '"+org_name+"'";
		var conn = mysql.createConnection(dbInfo);

		conn.query(queryString, function(err, rows, fields){
			if(err){
				log.fail("Error making organization queue inactive. " + err);
				return err;
			}
			fn(err, rows);
			conn.end();
		});
	},

	getUsersInQueue : function(dbInfo, org_name, fn){
		//log.debug(org_name);
		var queryString = "SELECT username FROM queue WHERE organization_id = (SELECT organization_id FROM organizations WHERE organization_name = '"+org_name+"')";
		//log.debug(queryString);
		var conn = mysql.createConnection(dbInfo);

		conn.query(queryString, function(err, rows, fields){
			if(err){
				log.fail("Error getting users from queue. "+ err);
				return err;
			}
			fn(err, rows);
			conn.end();
		});
	},

	userIsAdmin : function(dbInfo, username, org_name, fn){
		var queryString = "SELECT is_admin FROM user_organization WHERE username = '"+username+"' AND organization_id = (SELECT organization_id FROM organizations WHERE organization_name = '"+org_name+"')";
		var conn = mysql.createConnection(dbInfo);

		conn.query(queryString, function(err, rows, fields){
			if(err){
				log.fail("Error querying if user is admin");
				return err;
			}
			fn(err, rows);
			conn.end();
		});
	}
}

function userIsAdmin(dbInfo, username, org_name, fn){
		var queryString = "SELECT is_admin FROM user_organization WHERE username = '"+username+"' AND organization_id = (SELECT organization_id FROM organizations WHERE organization_name = '"+org_name+"')";
		var conn = mysql.createConnection(dbInfo);

		conn.query(queryString, function(err, rows, fields){
			if(err){
				log.fail("Error querying if user is admin");
				return err;
			}
			fn(err, rows);
			conn.end();
		});
}























