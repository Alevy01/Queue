# delete the database if it already exists
drop database if exists QueueDB;

# create a new database named project3
create database QueueDB;

#This checks if the user already exists and drops it if
#it does.
#This is a workaround for the lack of "if user exists"
DROP PROCEDURE IF EXISTS QueueDB.drop_user_if_exists ;
DELIMITER $$
CREATE PROCEDURE QueueDB.drop_user_if_exists()
BEGIN
  DECLARE foo BIGINT DEFAULT 0 ;
  SELECT COUNT(*)
  INTO foo
    FROM mysql.user
      WHERE User = 'QueueUser' and  Host = 'localhost';
   IF foo > 0 THEN
         DROP USER 'QueueUser'@'localhost' ;
  END IF;
END ;$$
DELIMITER ;
CALL QueueDB.drop_user_if_exists() ;
DROP PROCEDURE IF EXISTS QueueDB.drop_users_if_exists ;

#Create the QueueUser on your local DB.
CREATE USER 'QueueUser'@'localhost' IDENTIFIED BY 'N3onIc3d';
GRANT ALL ON QueueDB.* TO 'QueueUser'@'localhost';


# switch to the new database
use QueueDB;

create table users (
    username    varchar(30) not null UNIQUE,
    email       varchar(30) not null,
    salt        varchar(50) not null,
    hash_code   varchar(50) not null,
    primary key (username)
);

create table organizations (
    organization_id     	int auto_increment,
    organization_name   	varchar(50) not null,
    organization_salt   	varchar(50) not null,
    organization_hash_code  varchar(50) not null,
    organization_owner		varchar(30) not null,
    is_queue_active			boolean not null,
    primary key (organization_id)
);

create table user_organization (
    username            varchar(30) not null,
    organization_id     varchar(50) not null,
    organization_owner  boolean not null,
    is_admin			boolean not null
);

create table queue (
    username            varchar(30) not null,
    organization_id     int not null,
    queue_id            int not null
);

INSERT INTO users 
(username, email, salt, hash_code)
VALUES
('adam', 'a@a.com', '12345678901234567890', 'fdfd75ed7db53c8c4f44d715bc64e8e8cff070ef'),
('steven', 's@s.com', '12345678901234567890', 'fdfd75ed7db53c8c4f44d715bc64e8e8cff070ef'),
('tomer', 't@t.com', '12345678901234567890', 'fdfd75ed7db53c8c4f44d715bc64e8e8cff070ef'),
('tj', 't@a.com', '12345678901234567890', 'fdfd75ed7db53c8c4f44d715bc64e8e8cff070ef');

INSERT INTO organizations 
(organization_name, organization_salt, organization_hash_code, organization_owner, is_queue_active)
VALUES
('testOrg', '12345678901234567890', 'fdfd75ed7db53c8c4f44d715bc64e8e8cff070ef', 'adam', FALSE),
('PDT', '12345678901234567890', 'fdfd75ed7db53c8c4f44d715bc64e8e8cff070ef', 'adam', FALSE);

INSERT INTO user_organization
(username, organization_id, organization_owner, is_admin)
VALUES
('adam', (SELECT organization_id FROM organizations where organization_name = 'testOrg'), TRUE, TRUE),
('adam', (SELECT organization_id FROM organizations where organization_name = 'PDT'), TRUE, TRUE),
('steven', (SELECT organization_id FROM organizations where organization_name = 'testOrg'), FALSE, TRUE),
('tomer', (SELECT organization_id FROM organizations where organization_name = 'testOrg'), FALSE, FALSE),
('tj', (SELECT organization_id FROM organizations where organization_name = 'testOrg'), FALSE, FALSE),
('tj', (SELECT organization_id FROM organizations where organization_name = 'PDT'), FALSE, FALSE);


