//
//  userOrganizationsController.swift
//  Queue
//
//  Created by Adam Levy on 6/27/15.
//  Copyright (c) 2015 Adam Levy. All rights reserved.
//

import Foundation
import UIKit
import Alamofire
import SwiftyJSON
import Darwin

class userOrganizationsController: UIViewController, UITextFieldDelegate, UITableViewDelegate, UITableViewDataSource {
    
    var server = "http://localhost:8000"
    @IBOutlet var tableView: UITableView!
    var organizations : [String] = []
    var orgToPass : String =  ""
    
    func getOrgs(){
        Alamofire.request(.GET, server+"/getOrganizations")
            .responseJSON { (request, response, jsonObj, error) in
                    let json = JSON(jsonObj!)
                    for (key, subJson) in json["organizations"] {
                        if let org = subJson["organization_name"].string {
                            self.organizations.append(org)
                        }
                    }
                self.tableView.reloadData()
            }
    }
    


    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return self.organizations.count
    }
    
    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell{
        
        var cell:UITableViewCell = self.tableView.dequeueReusableCellWithIdentifier("cell") as! UITableViewCell
        cell.textLabel?.text = self.organizations[indexPath.row]
        
        return cell
    }
    
    func tableView(tableView: UITableView, didSelectRowAtIndexPath indexPath: NSIndexPath) {
        let org : String = organizations[indexPath.row]
        //println(org)
        orgToPass = org
        
        
        Alamofire.request(.GET, server+"/isUserAdmin/"+orgToPass)
            .responseJSON{(request, response, jsonObj, error) in
                let json = JSON(jsonObj!)
                let str = json["is_admin"]
                let val = str["is_admin"]

                if(val == 1){
                   self.performSegueWithIdentifier("toAdminOrgController", sender: nil)
                }
                else{
                  self.performSegueWithIdentifier("toOrgController", sender: nil)
                }
        }
        
    }

    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
       
//        Alamofire.request(.GET, server+"/isUserAdmin/"+orgToPass)
//            .responseJSON{(request, response, jsonObj, error) in
//                let json = JSON(jsonObj!)
//                let str = json["is_admin"]
//                if(str){
//                    var adminOrgController : organizationAdminController = segue.destinationViewController as! organizationAdminController
//                    
//                    adminOrgController.orgName = self.orgToPass
//                }
//                else{
//                    var orgController : organizationController = segue.destinationViewController as! organizationController
//                    orgController.orgName = self.orgToPass // get data by index and pass it to second view controller
//                }
//        }
        
        
        if (segue.identifier == "toAdminOrgController"){
            var adminOrgController : organizationAdminController = segue.destinationViewController as! organizationAdminController
            
            adminOrgController.orgName = self.orgToPass
            
        }
        else if(segue.identifier == "toOrgController"){
            var orgController : organizationController = segue.destinationViewController as! organizationController
            orgController.orgName = self.orgToPass // get data by index and pass it to second view controller
        }
    }
    
    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        getOrgs()
        //sleep(10)
        self.tableView.registerClass(UITableViewCell.self, forCellReuseIdentifier: "cell")
    }
    
    
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

    
}