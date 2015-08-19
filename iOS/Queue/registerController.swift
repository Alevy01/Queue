//
//  registerController.swift
//  Queue
//
//  Created by Adam Levy on 6/4/15.
//  Copyright (c) 2015 Adam Levy. All rights reserved.
//

import UIKit
import Alamofire
import SwiftyJSON

class registerController: UIViewController, UITextFieldDelegate {
    
    @IBOutlet weak var usernameField : UITextField!
    @IBOutlet weak var passwordField : UITextField!
    @IBOutlet weak var emailField : UITextField!
    
    var server = "http://localhost:8000"
    
    override func viewDidLoad() {
        super.viewDidLoad()
        self.usernameField.delegate = self;
        self.passwordField.delegate = self;
        self.emailField.delegate = self;
        
        if(count(passwordField.text) < 6){
            passwordField.textColor = UIColor.redColor();
        }
        if(count(passwordField.text) >= 6) {
            passwordField.textColor = UIColor.greenColor();
        }
        
    }
    

    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    @IBAction func registerPressed(sender : UIButton){
        var username : NSString = usernameField.text;
        var password : NSString = passwordField.text;
        var email : NSString = emailField.text;
        
        let parameters = [
            "username" : username,
            "password" : password,
            "email_address" : email
        ]
        
        if(password.length < 6){
            var alertView: UIAlertView = UIAlertView()
            alertView.title = "Register Failed!"
            alertView.message = "Your password must be at least 6 characters."
            alertView.delegate = self
            alertView.addButtonWithTitle("OK")
            alertView.show()
        }
        
        else{
            Alamofire.request(.POST, server+"/register", parameters: parameters)
                .responseJSON { (req, res, jsonObj, err) in
                    
                    let json = JSON(jsonObj!)
                    let str = json["success"]
                    
                    //If the user is successfully registered
                    if(str) {
                        let alertController = UIAlertController(
                            title: "Congratulations",
                            message: "You have Successfully Registered.",
                            preferredStyle: UIAlertControllerStyle.Alert
                        )
                        let okAction = UIAlertAction(
                            title: "OK",
                            style: UIAlertActionStyle.Destructive) { (action) in
                                let vc : AnyObject! = self.storyboard!.instantiateViewControllerWithIdentifier("loginController")
                                self.showViewController(vc as! UIViewController, sender: vc)
                        }
                        alertController.addAction(okAction)
                        self.presentViewController(alertController, animated: true, completion: nil)
                        
                        
                        
                        
                        
                        var session = NSURLSession.sharedSession()
                        println(session)
                    
                        var httpCookie : [NSHTTPCookie] = NSHTTPCookieStorage.sharedHTTPCookieStorage().cookies as! [NSHTTPCookie]
                    
                        for cookieA:NSHTTPCookie in httpCookie as [NSHTTPCookie] {
                            println(cookieA);
                        }
                    
                    }
                    else{
                    
                    }
            }
        }

        
    }
    
    
    
}