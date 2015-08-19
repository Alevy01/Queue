//
//  addNewOrgController.swift
//  Queue
//
//  Created by Adam Levy on 6/29/15.
//  Copyright (c) 2015 Adam Levy. All rights reserved.
//


import Foundation
import UIKit
import Alamofire
import SwiftyJSON

class addNewOrgController: UIViewController, UITextFieldDelegate{

    @IBOutlet weak var organizationName : UITextField!
    @IBOutlet weak var organizationPassword : UITextField!
    
    var server = "http://localhost:8000"
    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        self.organizationName.delegate = self
        self.organizationPassword.delegate = self
    }
    
    func alertView(){
        
    }
    
    @IBAction func createPressed(sender : UIButton){
        var organization_name : NSString = organizationName.text
        var organization_pass : NSString = organizationPassword.text
        
        if(organization_name.isEqualToString("") || organization_pass.isEqualToString("")){
            var alertView:UIAlertView = UIAlertView()
            alertView.title = "Sign in Failed!"
            alertView.message = "Please enter an Organization Name and Password"
            alertView.delegate = self
            alertView.addButtonWithTitle("OK")
            alertView.show()
        }
        else if(organization_pass.length < 6){
            var alertView: UIAlertView = UIAlertView()
            alertView.title = "Sign in Failed!"
            alertView.message = "Your password must be at least 6 characters."
            alertView.delegate = self
            alertView.addButtonWithTitle("OK")
            alertView.show()
        }
        else{
            let parameters = [
                "organization_name" : organization_name,
                "organization_password" : organization_pass
            ]
            
            Alamofire.request(.POST, server+"/addNewOrganization", parameters : parameters)
                .responseJSON {(req, res, jsonObj, err) in
                    let json = JSON(jsonObj!)
                    if(err == nil){
                        let alertController = UIAlertController(
                            title: "Congratulations",
                            message: "You have created a new Organization.",
                            preferredStyle: UIAlertControllerStyle.Alert
                        )
                        let okAction = UIAlertAction(
                            title: "OK",
                            style: UIAlertActionStyle.Destructive) { (action) in
                                let vc : AnyObject! = self.storyboard!.instantiateViewControllerWithIdentifier("UserOrganizationsController")
                                    self.showViewController(vc as! UIViewController, sender: vc)
                            }
                        alertController.addAction(okAction)
                        self.presentViewController(alertController, animated: true, completion: nil)
                    }
                    
                }
        }
    }
}