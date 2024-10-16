const userController = require('../controllers/userController');
const articleController = require('../controllers/articleController');
const multer = require('multer');

const express = require('express')
const router = express.Router()
const storage = multer.memoryStorage();
const upload = multer({ storage });


// userDashboard
router.get('/',userController.userDashboard)  
// userSignup
router.post('/signup',userController.userSignup)  
// set intrests
router.post('/setintrest/:userId',userController.setCategory)
// userLogin 
router.post('/login',userController.userLogin)
// user profile update
router.put('/update/:userId',upload.single('profilePicture'),userController.editProfile)
// user profile data get
router.get('/getuser/:userId',userController.getUserdata)
// add articles 
router.post('/addarticles/:userId', upload.array('images', 10), articleController.addArticle);
router.put('/editarticle/:artId', upload.array('images', 10), articleController.editArticle); 
// get user articles 
router.get('/getarticles/:userId',articleController.getUserArticles)
// list articnles based on the user intrests
router.get('/listarticles/:userId',articleController.listArticles)
// article detial page
router.get('/article/:artId',articleController.getArticle)
// like & dislike route with socket implementation
router.post('/like/:artId/:userId',articleController.likeArticles)
router.post('/dislike/:artId/:userId',articleController.dislikeArticles)
router.post('/report/:artId/:userId',articleController.reportArticle)
router.delete('/delete/:artId/:userId',articleController.deleteArticle)
// change password
router.post('/changePass/:userId',userController.changePassword)


module.exports = router;