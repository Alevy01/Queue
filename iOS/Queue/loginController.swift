//
//  loginController.swift
//  Queue
//
//  Created by Adam Levy on 6/4/15.
//  Copyright (c) 2015 Adam Levy. All rights reserved.
//

import UIKit
import Alamofire
import SwiftyJSON

class loginController: UIViewController, UITextFieldDelegate {
    
    @IBOutlet weak var usernameField : UITextField!
    @IBOutlet weak var passwordField : UITextField!
    
    var server = "http://localhost:8000";
    
    override func viewDidLoad() {
        super.viewDidLoad()
        self.usernameField.delegate = self;
        self.passwordField.delegate = self;
        
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    

    
    @IBAction func loginPressed(sender : UIButton){
        var username : NSString = usernameField.text;
        var password : NSString = passwordField.text;
        
        if(username.isEqualToString("") || password.isEqualToString("")){
            var alertView:UIAlertView = UIAlertView()
            alertView.title = "Sign in Failed!"
            alertView.message = "Please enter a Username and Password"
            alertView.delegate = self
            alertView.addButtonWithTitle("OK")
            alertView.show()
        }
        else if(password.length < 6){
            var alertView: UIAlertView = UIAlertView()
            alertView.title = "Sign in Failed!"
            alertView.message = "Your password must be at least 6 characters."
            alertView.delegate = self
            alertView.addButtonWithTitle("OK")
            alertView.show()
        }
        else{
            let parameters = [
                "username" : usernameField.text,
                "password" : passwordField.text
            ]
            //Make POST request to login with user credentials
            
            Alamofire.request(.POST, server+"/login", parameters : parameters)
                .responseJSON { (req, res, jsonObj, err) in
                    let json = JSON(jsonObj!)
                    
                    let str = json["success"]
                    //If the user is successfully registered
                    if(str) {
                        var session = NSURLSession.sharedSession()
                        //println(session)
                        
                        self.performSegueWithIdentifier("toUserOrgController", sender: nil)

                    }
                    else{
                        var alertView: UIAlertView = UIAlertView()
                        alertView.title = "Sign in Failed!"
                        alertView.message = "Your Username and Password do not match. Please Try Again."
                        alertView.delegate = self
                        alertView.addButtonWithTitle("OK")
                        alertView.show()
                    }
            }
        }
    
    }
    
}
