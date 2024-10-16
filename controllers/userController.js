const User = require("../model/userModel");
const bcrypt = require('bcrypt');
const cloudinary = require('../middlewares/cloudinary');
const multer = require('multer');
const jwt = require('jsonwebtoken')

exports.userDashboard = (req,res)=>{
    res.send('server is running')
}

exports.userSignup = async(req,res)=>{
try {
    console.log(req.body);
    const userData = req.body


    const existUser = await User.findOne({
        $or:[{phone:userData.phone},{email:userData.email}]
    })

    if(existUser){
        res.status(400).json({message:'User already Exist With Same Credentials'})
        return
    }

    const saltRound = 10;
    const hashedPassword = await bcrypt.hash(userData.password,saltRound)


    const newUser = new User({
        firstName:userData.firstName,
        lastName:userData.lastName,
        phone:userData.phone,
        email:userData.email,
        dateOfBirth:userData.dateOfBirth,
        password:hashedPassword,
        profileUrl:'https://media.istockphoto.com/id/1131164548/vector/avatar-5.jpg?s=612x612&w=0&k=20&c=CK49ShLJwDxE4kiroCR42kimTuuhvuo2FH5y_6aSgEo='
        
    })

   

    await newUser.save()
    const token = jwt.sign({id:newUser._id,email:newUser.email},process.env.JWT_SECRET_KEY,{
        expiresIn:'1d'
    })

    res.status(200).json({message:'User registed Successfully',user:newUser,token})
} catch (error) {
    console.error('Error in user registration:', error);
    res.status(500).json({ message: 'Internal server error' });
    
}  
}

exports.setCategory = async(req,res)=>{
    try {
        const {userId} = req.params;
        const {interests} = req.body;

        const user = await User.findById(userId)

        if(!user){
            return res.status(400).json({message:'User Not Found'})
        }

        user.interests = interests;

        await user.save();

        res.status(200).json({message:'Interests updated successfully', user })

        
        
    } catch (error) {
        console.error('Error updating interests:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.userLogin = async(req,res)=>{
    try {

        const { emailOrPhone, password } = req.body;
        const user = await User.findOne({
            $or:[{phone:emailOrPhone},{email:emailOrPhone}]
        })

        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);


        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({id:user._id,email:user.email},process.env.JWT_SECRET_KEY,{
            expiresIn:'1d'
        })

        res.status(200).json({ message: 'Login successful', user , token});
        
    } catch (error) {
        console.error('Error during login:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });    
        
    }
}

exports.editProfile = async (req, res) => {
    try {
        console.log('Edit request received');

        const { userId } = req.params;
        const { firstName, lastName, phone, email, dateOfBirth,interests } = req.body;

        
        let profileUrl;

        if (req.file) {
            console.log('File received:', req.file);
            profileUrl = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'user_profiles' },
                    (error, result) => {
                        if (error) {
                            console.error('Error uploading image to Cloudinary:', error);
                            return reject(new Error('Error uploading image to Cloudinary'));
                        }
                        console.log('Upload result:', result);
                        resolve(result.secure_url);
                    }
                );
                uploadStream.end(req.file.buffer);
            });
        } else {
            console.log('No file uploaded');
        }

       

         // Parse interests if it's a stringified JSON array
         let parsedInterests;
         if (typeof interests === 'string') {
             try {
                 parsedInterests = JSON.parse(interests);
             } catch (e) {
                 console.error('Error parsing interests:', e);
                 return res.status(400).json({ message: 'Invalid interests format' });
             }
         } else {
             parsedInterests = interests; // Assume it's already an array if not a string
         }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                firstName,
                lastName,
                phone,
                email,
                dateOfBirth,
                interests:parsedInterests,
                profileUrl: profileUrl || req.body.profileUrl,
            },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error in editProfile:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}


exports.getUserdata = async(req,res)=>{
    try {

        
        const {userId} = req.params;

        const user = await User.findById(userId)
        
        if(!user){
            return res.status(400).json({message:'User Not Found'})
        }

     
        
        res.status(200).json({user})


    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  exports.changePassword = async(req,res)=>{
    try {

        const {userId} = req.params

        const {oldPass,newPass} = req.body
        if (!oldPass || !newPass) {
            return res.status(400).json({ message: 'Old password and new password are required.' });
        }

   
        

        const user = await User.findById(userId);

        if(!user){
          
            
            return res.status(400).json({message:'User Not Found'})
        }

        const passwordValid = await bcrypt.compare(oldPass,user.password)

        if(!passwordValid){
           
            
            return res.status(400).json({ message: 'Invalid Password' });
        }

        const saltRound = 10;
        const hashedPassword = await bcrypt.hash(newPass,saltRound);

        user.password = hashedPassword

        user.save()

        res.status(200).json({message:" password changed success fully"})
    
        


        
    } catch (error) {
        console.log(error);
        
        
    }
  }