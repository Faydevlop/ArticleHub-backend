const User = require("../model/userModel");
const bcrypt = require('bcrypt');
const cloudinary = require('../middlewares/cloudinary');
const multer = require('multer');
const Article = require('../model/artichleModel');
const { io } = require("../app");

exports.addArticle = async (req, res) => {
    try {
        const {userId} = req.params
      const { name, description, categories } = req.body;
  
      // Check if files were uploaded
      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        // Use Promise.all to upload all images simultaneously
        imageUrls = await Promise.all(
          req.files.map((file) => {
            return new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'article_images' }, // Create a separate folder for article images
                (error, result) => {
                  if (error) {
                    console.error('Error uploading image to Cloudinary:', error);
                    return reject(new Error('Error uploading image to Cloudinary'));
                  }
                  resolve(result.secure_url);
                }
              );
              uploadStream.end(file.buffer);
            });
          })
        );
      }
  
      // Create the article document
      const newArticle = new Article({
        articleName:name,
        description,
        category: categories ? categories.split(',') : [],
        images: imageUrls, // Save the Cloudinary URLs to the 'images' field
        createdBy: userId,
      });
  
      await newArticle.save();
  
      res.status(201).json({
        message: 'Article added successfully',
        article: newArticle,
      });
    } catch (error) {
      console.error('Error in addArticle:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  exports.editArticle = async (req, res) => {
    try {
        const { artId ,userId } = req.params;
        const { name, description, categories, existingImages } = req.body;




        // Find the article by ID
        const article = await Article.findById(artId);
        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        if(article.createdBy.toString() !== userId ){
          return res.status(400).json({message:'Not Access'});
        }

        // Parse existing images from frontend (to track which ones were removed)
        const updatedExistingImages = JSON.parse(existingImages);
        
        // Find removed images
        const removedImages = article.images.filter(img => !updatedExistingImages.includes(img));

        // Remove the missing images from Cloudinary (optional, if required)
        if (removedImages.length > 0) {
            removedImages.forEach(async (image) => {
                // Extract public ID from Cloudinary image URL to delete from Cloudinary
                const publicId = image.split('/').pop().split('.')[0]; // Adjust as per URL structure
                await cloudinary.uploader.destroy(publicId);
            });
        }

        // Check if files were uploaded and process image uploads
        let imageUrls = updatedExistingImages; // Keep updated existing images
        if (req.files && req.files.length > 0) {
            const newImageUrls = await Promise.all(
                req.files.map((file) => {
                    return new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            { folder: 'article_images' },
                            (error, result) => {
                                if (error) {
                                    console.error('Error uploading image to Cloudinary:', error);
                                    return reject(new Error('Error uploading image to Cloudinary'));
                                }
                                resolve(result.secure_url);
                            }
                        );
                        uploadStream.end(file.buffer);
                    });
                })
            );
            imageUrls = [...imageUrls, ...newImageUrls];
        }

        // Update the article fields
        article.articleName = name || article.articleName;
        article.description = description || article.description;
        article.category = categories ? categories.split(',') : article.category;
        article.images = imageUrls;

        // Save the updated article
        await article.save();

        res.status(200).json({
            message: 'Article updated successfully',
            article,
        });
    } catch (error) {
        console.error('Error in editArticle:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


  exports.getUserArticles = async(req,res)=>{
    try {
        console.log('req is here');
        
        const {userId} = req.params;
        const userArticles = await Article.find({createdBy:userId}).populate('createdBy')

        if(!userArticles){
            return res.status(400).json({message:'User Not Found'})
        }

        res.status(200).json({userArticles})
        
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  exports.listArticles = async(req,res)=>{
    try {
        const {userId} = req.params;
        console.log('req is here ',userId);
        

        const user = await User.findById(userId)
        if(!user){
            return res.status(404).json({message:'User not found'})
        }

        const articles = await Article.find({
            category:{$in:user.interests},
            reportBy: { $nin: [userId] },
        }).populate('createdBy');

        res.status(200).json({articles});

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  exports.getArticle = async(req,res)=>{
    try {

        const {artId} = req.params;

        const articleData = await Article.findById(artId).populate('createdBy')

        if(!articleData){
            return res.status(400).json({message:'Aricle not Found'})
        }

        res.status(200).json({article:articleData})


        
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  exports.likeArticles = async(req,res)=>{
    try {

      const artId = req.params.artId;
      const userId = req.params.userId;
      console.log('req is here',artId,userId);
      

      const article = await Article.findById(artId)

      if(!article){
        return res.status(200).json({message:"Article Not Found"})
      }

      const hasliked = article.likedBy.includes(userId)
      const hasdisliked = article.dislikedBy.includes(userId)

      if(hasliked){
        article.likedBy = article.likedBy.filter(id => id.toString() !== userId)
        article.likes -= 1
        if(hasdisliked){
          article.dislikedBy = article.dislikedBy.filter(id => id.toString() !== userId);
          article.dislikes -= 1;
        }

      }else{
        article.likedBy.push(userId)
        article.likes += 1
        if(hasdisliked){
          article.dislikedBy = article.dislikedBy.filter(id => id.toString() !== userId);
          article.dislikes -= 1;
        }
      }

      await article.save()
      res.status(200).json({message:'Article Liked'})



      
      
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  exports.dislikeArticles = async (req, res) => {
    try {
      const { artId } = req.params;
      const { userId } = req.params;
      console.log('req is here',artId,userId);
      const article = await Article.findById(artId);
  
      if (!article) {
        return res.status(404).json({ message: 'Article Not Found' });
      }
  
      const hasDisliked = article.dislikedBy.includes(userId);
      const hasliked = article.likedBy.includes(userId)
  
      if (hasDisliked) {
        article.dislikedBy = article.dislikedBy.filter(id => id.toString() !== userId);
        article.dislikes -= 1;
        if(hasliked){
          article.likedBy = article.likedBy.filter(id => id.toString() !== userId)
          article.likes -= 1
        }
      } else {
        article.dislikedBy.push(userId);
        article.dislikes += 1;
        if(hasliked){
          article.likedBy = article.likedBy.filter(id => id.toString() !== userId)
          article.likes -= 1
        }
      }
  
      await article.save();

      return res.status(200).json({message:'Article disliked'})
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  exports.reportArticle = async(req,res)=>{
    try {
      const { artId } = req.params;
      const { userId } = req.params;
      console.log('req for report is here is here ',artId,userId);
      
      const article = await Article.findById(artId);

      if (!article) {
        return res.status(404).json({ message: 'Article Not Found' });
      }

      article.reportBy.push(userId);

      await article.save()

      res.status(200).json({message:'Article Reported'})
  

    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  exports.deleteArticle = async (req, res) => {
    try {
      const { artId, userId } = req.params;
  
      // Find the article by ID
      const article = await Article.findById(artId);
  
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }
  
      // Check if the logged-in user is the author of the article
      if (article.createdBy.toString() !== userId) {
        return res.status(403).json({ message: 'You are not authorized to delete this article' });
      }
  
      // Proceed with deletion if authorized
      await article.deleteOne();
  
      res.status(200).json({ message: 'Article deleted successfully' });
      
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  
