//
//  organizationAdminController.swift
//  Queue
//
//  Created by Adam Levy on 8/1/15.
//  Copyright (c) 2015 Adam Levy. All rights reserved.
//

import UIKit
import Alamofire
import SwiftyJSON

class organizationAdminController: UIViewController, UITextFieldDelegate {

    var server = "http://localhost:8000";
    var orgName : String = ""
    @IBOutlet var tableView: UITableView!
    //@IBOutlet weak var orgLabel : UILabel!
    @IBOutlet weak var adminNavBar : UINavigationBar!
    
    var users : [String] = []
    
    
    func getUsersInQueue(){
        Alamofire.request(.GET, server+"/getUsersInQueue/"+orgName)
            .responseJSON { (request, response, jsonObj, error) in
                //println(jsonObj)
                let json = JSON(jsonObj!)
                for (key, subJson) in json["users"] {
                    if let user = subJson["username"].string {
                        self.users.append(user)
                        //println(user)
                    }
                }
               // println(self.users)
                self.tableView.reloadData()
        }
    }
    
    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return self.users.count
    }
    
    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell{
        var cell:UITableViewCell = self.tableView.dequeueReusableCellWithIdentifier("cell") as! UITableViewCell
        cell.textLabel?.text = self.users[indexPath.row]
        return cell
    }
    
    func tableView(tableView: UITableView, didSelectRowAtIndexPath indexPath: NSIndexPath) {
        //let org : String = organizations[indexPath.row]
        //println(org)
        //orgToPass = org
        
        //performSegueWithIdentifier("toOrgController", sender: nil)
        
    }
    
    
    @IBAction func nextUserPressed(sender : UIButton){
        let parameter = [
            "org_name" : orgName
        ]
        
        Alamofire.request(.POST, server+"/removeUserFromQueue")
            .responseJSON { (req, res, jsonObj, err) in
                    let json = JSON(jsonObj!)
                    let str = json["success"]
                
                if(str){
                    self.tableView.reloadData()
                    //Where I should make the push notification for next user
                }
                else{
                    println("ERROR!");
                }
            
            }
    }
    
    @IBAction func addToQueuePressed(sender : UIButton){
        
        
        let parameters = [
            "org_name" : orgName
        ]
        
        Alamofire.request(.POST, server+"/addUserToQueue", parameters : parameters)
            .responseJSON { (req, res, jsonObj, err) in
                let json = JSON(jsonObj!)
                
                let str = json["success"]
                
                if(str) {
                    self.getUsersInQueue()
                    var alertView: UIAlertView = UIAlertView()
                    alertView.title = "Success!"
                    alertView.message = "Your have been added to the list."
                    alertView.delegate = self
                    alertView.addButtonWithTitle("OK")
                    alertView.show()
                }
                else{
                    println("ERROR");
                }
                
                
        }
    }
    
    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        self.adminNavBar.topItem?.title = self.orgName
        getUsersInQueue()
        //sleep(10)
        self.tableView.registerClass(UITableViewCell.self, forCellReuseIdentifier: "cell")
        self.tableView.reloadData()
    }

    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
}
