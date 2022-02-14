const express = require ('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const _ = require('lodash');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const multer = require('multer');

//-------------here multer is customised as per needs of file type and size-----------
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
       return cb(new Error('Pleas upload correct file'))
     }
   }
 })

const app = express()

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.use(session({
  secret: "out little secrets",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/postsDB', function() {
  console.log("Database is connected successfully.");
});


const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  secret: [String]
})

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

const postSchema = new mongoose.Schema({
  frontImage: Buffer,
  name: String,
  category: String,
  content: String,
  comments: [String]
});

const Blogpost = mongoose.model('Blogpost', postSchema);

let add = "String";
const testFile = "Lorem ipsum dolor, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
const about = "Egestas fringilla  Nibh ipsum consequat nisl vel pretium lectus quam id leo. Tristique senectus et netus et malesuada fames ac. Risus in hendrerit gravida rutrum q"
const terms = "ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur"

//-------------------------the Home page-------------------------

app.get('/', (req, resp) => {
  Blogpost.find({}, (req,res)=>{
    const posts=res;
    resp.render("index", {
      type: '',
      posts:posts
    })
  });
})

//-----------------------here all the contact us etc. routes are dealt with.-------------------------------

app.get('/getInTouch/:contacts', (req,res)=>{
  const x= req.params.contacts;
  res.render('contacts',{
    title: x,
    content: testFile
  });
})


//----------------------------signin part-----------------------

app.get('/signin',(req,res)=>{
  res.render('signin')
})

app.post ('/signin', passport.authenticate("local"), function(req, res){
  const user = new User({
    email: req.body.username,
    password:req.body.password
  });
  req.login(user, function(err) {
    if (err)
      { console.log(err);}
    else{
      passport.authenticate("local")(req,res, function(){
        res.redirect("/");
      });
    }
});
})


app.get('/auth',(req,res)=>{
  if(req.isAuthenticated()){
    res.render('alerts');
  }else{
    res.redirect('/signin');
  }
})

//--------------------------logout part-------------------------

app.get('alerts', function(req, res){
  req.logout();
  res.redirect('/');
});

//--------------------------register part-----------------------
app.get("/register", function(req,res){
  res.render('register');
})

app.post('/register', function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err){
      console.log(err);
      res.redirect('/register');
    }else{
      passport.authenticate("local")(req,res, function(){
        res.redirect("/");
      });
    }
  });
})


//------------------------editor document--------------------------

app.get('/editor',(req,res)=>{
  if(req.isAuthenticated()){
    res.render('editor', {
        myTitleImage: add
    });
  }else{
    res.redirect('/signin');
  }
})

app.post('/editor', (req,res)=>{
  const entry = new Blogpost({
    name: req.body.postTitle,
    category: req.body.postCategory,
    content: req.body.postBody,
    frontImage: add
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

app.post('/titleImage', upload.single('titleImage'), function (req, res, next) {
  add=req.file.buffer.toString('base64');
  res.redirect('/editor');
})

// ---------getting to the blog document---------------------------

app.get('/category/:type/posts/:postId/', (req, res)=> {
  const x = req.params.postId;
  const y = req.params.type;
  Blogpost.findOne({_id: x}, (err,result)=>{
    if (err){
      console.log(err);
    }else{
      res.render('posts',{
        title: result.name,
        content: result.content,
        titleImage: result.frontImage,
        comments: result.comments,
        t: y,
        postid: x
      });
    }
  });
});

//-----------showing posts by particular category selected-------

app.post('/category', (req,resp)=>{
  const x = req.body.field;
    Blogpost.find({category: x}, (req,res)=>{
      const posts=res;
      //console.log(posts);
      resp.render("index", {
        type: x,
        posts:posts
      })
    });
})

//-------------------------getting posts by particular user----------------------------
                //-----------revision is vry well reqd-------------
app.get('/User/Highlight',(req,res)=>{

  if(req.isAuthenticated()){
    //console.log(req.user.secret);
    Blogpost.find({_id: req.user.secret}, (err,result)=>{
      if (err){
        console.log(err);
      }else{
        res.render('categories',{
          type: "Hi User its your place",
          posts:result
        })
      }
    })
  }else{
    res.redirect('/signin');
  }
})

//----------------commenting feature in post----------------

app.post('/comment', (req,res)=>{
  if(req.isAuthenticated()){
    var str="";
    let arr =[];
    const x=req.body.commentButton;
    const com = req.body.commentArea;

    //----------- here id of post is found using loop and stored in str-------------

    for (var k = (x.length-2); k>=0; k--){
      if (x[k]==="/"){
        break;
      }else{
        str=str+x[k];
      }
    }
    str=str.split("").reverse().join("");

    Blogpost.findOne({_id: str}, (err,result)=>{
      if (err){
        console.log(err);
      }else{
          arr= result.comments;
          arr.push(com);
          arr.push(req.user.username);
          Blogpost.updateOne({_id: str},{
            comments: arr
          },(err,result)=>{
            if(err){
              console.log(err);
            }
          })
      }
    })
    res.redirect(x);
  }else{
    res.redirect('/signin');
  }
})

//-------------------------Deleting Posts by User---------------
  app.post('/del', (req,res)=>{
    if(req.isAuthenticated()){
      Blogpost.findByIdAndDelete(req.body.deleteDoc, function (err) {
        if(err) console.log(err);
        console.log("Successful deletion");
      });
      let ar = req.user.secret
      for (var q=0; q<ar.length; q++){
        if (ar[q]===req.body.deleteDoc){
          console.log(ar);
          ar.splice(q, 1);
          console.log(ar);
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

      res.redirect('/');
    }
    else{
      res.redirect('/signin');
    }

  }

)

//-------------server listening function------------------------

app.listen(3000, () => {
  console.log('app is listening on port 3000')
})
