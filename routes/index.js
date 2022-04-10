const express = require ('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const _ = require('lodash');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const multer = require('multer');
const User = require("../models/user");
const Blogpost = require("../models/blogpost");
const Com = require("../models/coms");
const router = express.Router();

const upload = multer({
   limits: {
     fileSize: 1000000
   },
   fileFilter (req,file,cb){
     if(file.originalname.endsWith('.jpg')){
       cb(undefined, true);
     }
     else if(file.originalname.endsWith('.jpeg')){
       cb(undefined, true);
     }
     else if(file.originalname.endsWith('.png')){
       cb(undefined, true);
     }else{
       return cb(new Error('Please upload correct file'))
     }
   }
 })

 let add = "String";
 let check="";
 const testFile = "Lorem ipsum dolor, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
 const about = "Egestas fringilla  Nibh ipsum consequat nisl vel pretium lectus quam id leo. Tristique senectus et netus et malesuada fames ac. Risus in hendrerit gravida rutrum q"
 const terms = "ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur"



router.get('/', (requ, resp) => {
  Blogpost.find({}, (req,res)=>{
  const posts=res;
    if(requ.isAuthenticated()){
      resp.render('index',{
        type: '',
        posts:posts,
        Authentic: 'log-out'
      });
    }else{
      resp.render('index',{
        type: '',
        posts:posts,
        Authentic: 'log-in'
      });
    }
  });
})

//--------------------------------------------------------------------------here all the contact us etc. routes are dealt with.-------------------------------

router.get('/getInTouch/:contacts', (req,res)=>{
  const x= req.params.contacts;
  if (req.isAuthenticated()){
    check = 'log-out';
  }
  else {
    check = 'log-in';
  }
  res.render('contacts',{
    title: x,
    content: testFile,
    Authentic: check
  });
})


//-------------------------------------------------------------------------------signin part-----------------------

router.get('/signin',(req,res)=>{
  res.render('signin',{
    Authentic: 'log-in'
  })
})

router.post ('/signin', passport.authenticate("local" ,{failureRedirect: '/signin'}), function(req, res){
  const user = new User({
    email: req.body.username,
    password:req.body.password
  });

  req.login(user, function(err,result) {
    if (err)
      { console.log(result);}
    else{
      passport.authenticate("local")(req,res, function(){
        res.redirect("/");
      });
    }
});
})

//-------------------------------------------------------------------------------logout part-------------------------

router.post('/logout', function(req, res){
  if(!req.isAuthenticated()){
    res.redirect('/signin');
  }else{
    req.logout();
    res.redirect('/');
  }
});

//------------------------------------------------------------------------------register part-----------------------

router.get("/register", function(req,res){
  res.render('register',{
    Authentic:'log-in',
    checker: 'hidden'
  });
})

router.post('/register', function(req, res){
  let u = req.body.userName;
  let v = req.body.details;
  User.register({username: req.body.username}, req.body.password,function(err, user){
    if (err){
      console.log(err);
      res.render('register',{
        Authentic:'log-in',
        checker: ''
      });
    }else{
      passport.authenticate("local")(req,res, function(){
        User.findByIdAndUpdate(user._id, { userName: u, details: v}, (req,res)=>{});
        res.redirect("/");
      });
    }
  });
})

//-------------------------------------------------------------------------------editor document--------------------------

router.get('/editor',(req,res)=>{
  if(req.isAuthenticated()){
    res.render('editor', {
        myTitleImage: add,
        Authentic: 'log-out'
    });
  }else{
    res.redirect('/signin');
  }
})

router.post('/editor', (req,res)=>{
  const entry = new Blogpost({
    name: req.body.postTitle,
    category: req.body.postCategory,
    content: req.body.postBody,
    frontImage: add,
    writer: req.user.userName,
    about: req.user.details,
    mail: req.user.username
  });

  entry.save();
  let arr2=[];
  User.findById(req.user.id, function(err, foundUser){
    if (err){
      console.log(err);
    }else{
        arr2= foundUser.secret;
        arr2.push(entry._id);
        User.updateOne({_id: req.user.id},{
          secret: arr2
        },(err,result)=>{
          if(err){
            console.log(err);
          }
        })
    }
  })
  a="iamblank";
  res.redirect('/');
})

router.post('/titleImage', upload.single('titleImage'), function (req, res, next) {
  add=req.file.buffer.toString('base64');
  res.redirect('/editor');
})

// ---------------------------------------------------------------------------------getting to the blog document---------------------------

router.get('/category/:type/posts/:postId/', (req, res)=> {
  const x = req.params.postId;
  const y = req.params.type;
  if (req.isAuthenticated()){
    check = 'log-out';
  }
  else {
    check = 'log-in';
  }
  Blogpost.findOne({_id: x}, (err,result)=>{
    if (err){
      console.log(err);
    }else{
      Com.find({postId:x},(e,re)=>{
        res.render('posts',{
          title: result.name,
          content: result.content,
          titleImage: result.frontImage,
          comments: re,
          t: y,
          postid: x,
          Authentic: check,
          nameAuthor: result.writer,
          aboutAuthor: result.about
        });
      })

    }
  });
});

//---------------------------------------------------------------------------------showing posts by particular category selected-------

router.post('/category', (req,resp)=>{
  const x = req.body.field;
  if (req.isAuthenticated()){
    check = 'log-out';
  }
  else {
    check = 'log-in';
  }
    Blogpost.find({category: x}, (req,res)=>{
      const posts=res;
      resp.render("index", {
        type: x,
        posts:posts,
        Authentic: check
      })
    });
})

//---------------------------------------------------------------------------------getting posts/comments by particular user----------------------------

router.get('/User/Highlight',(req,res)=>{

  if(req.isAuthenticated()){
    Blogpost.find({_id: req.user.secret}, (err,result)=>{
      if (err){
        console.log(err);
      }else{
        Com.find({posterId:req.user.id},(e,re)=>{
          res.render('categories',{
            type: "Hi " + req.user.userName + " its your place",
            posts:result,
            Authentic: 'log-out',
            checker: '',
            nam: req.user.userName,
            abt: req.user.details,
            cmts: re
        })
      })
    }
  })
  }else{
    res.redirect('/signin');
  }
})

//------------------------------------------------------------------------------ getting to all posts by Particular Writer s----------------------

router.post('/writerProfile/:writer',(req,res)=>{
  const x= req.params.writer;
  const y = req.body.zoo;
  Blogpost.find({writer:x}, (err,result)=>{
    if (err){
      console.log(err);
    }else{
      res.render('categories',{
        type: "Hi, here is more from " +x,
        posts:result,
        Authentic: '',
        checker: 'hidden',
        nam: x,
        abt: '',
        cmts:''
      })
    }
  })

})

//-------------------------------------------------------------------------------commenting feature in post----------------

router.post('/comment', (req,res)=>{
  if(req.isAuthenticated()){
    var str="";
    let arr =[];
    const x=req.body.commentButton;
    const com = req.body.commentArea;
    for (var k = (x.length-2); k>=0; k--){
      if (x[k]==="/"){
        break;
      }else{
        str=str+x[k];
      }
    }
    str=str.split("").reverse().join("");
    // str has the post id.------------------
    const comment = new Com({
      postId:str,
      text:com,
      posterId:req.user._id,
      posterName:req.user.userName
    });
    comment.save();
    res.redirect(x);
  }else{
    res.redirect('/signin');
  }
})



//-------------------------------------------------------------------------------Deleting Posts by User---------------

  router.post('/del', (req,res)=>{
    if(req.isAuthenticated()){
      Blogpost.findByIdAndDelete(req.body.deleteDoc, function (err) {
        if(err) console.log(err);
      });
      let ar = req.user.secret
      for (var q=0; q<ar.length; q++){
        if (ar[q]===req.body.deleteDoc){
          ar.splice(q, 1);
          User.findByIdAndUpdate(
            { _id: req.user.id },
            { secret: ar },
            function(err, result) {
              if (err) {
                res.send(err);
              }
            }
      );
          break;
        }
      }
      res.redirect('/User/Highlight');
    }
    else{
      res.redirect('/signin');
    }
  }
)

//------------------------------------------------------------------------------Deleting Comments by user---------

router.post('/delCmt', (req,res)=>{
  if(req.isAuthenticated()){
    Com.findByIdAndDelete(req.body.deleteCmt, function (err) {
      if(err) console.log(err);
    });

    res.redirect('/User/Highlight');
  }
  else{
    res.redirect('/signin');
  }
}
)

module.exports = router;
