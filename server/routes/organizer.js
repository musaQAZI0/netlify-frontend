const express = require('express');
const Organizer = require('../models/Organizer');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get organizer profile by userId
router.get('/profile/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only view their own profile or public profiles
    const isOwnProfile = req.user._id.toString() === userId;
    const isAdmin = req.user.role === 'admin';
    
    const organizer = await Organizer.findOne({ userId: userId, isActive: true });
    
    if (!organizer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Organizer profile not found' 
      });
    }

    // Return appropriate profile based on permissions
    const profile = (isOwnProfile || isAdmin) 
      ? organizer.getFullProfile() 
      : organizer.getPublicProfile();

    res.json({
      success: true,
      profile: profile
    });

  } catch (error) {
    console.error('Organizer profile fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch organizer profile' 
    });
  }
});

// Create new organizer profile
router.post('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    // Check if user already has an organizer profile
    const existingProfile = await Organizer.findOne({ userId: userId });
    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: 'Organizer profile already exists for this user',
        profileId: existingProfile._id
      });
    }

    // Validate required fields
    const { name, bio, website, contactEmail, phone, address, organizationName, 
            facebookUrl, twitterHandle, instagramHandle, linkedinUrl, emailOptIn } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Organizer name is required'
      });
    }

    // Create new organizer profile
    const organizerData = {
      userId: userId,
      name: name.trim(),
      bio: bio ? bio.trim() : '',
      website: website ? website.trim() : '',
      contactEmail: contactEmail ? contactEmail.trim().toLowerCase() : req.user.email,
      phone: phone ? phone.trim() : '',
      address: address || {},
      organizationName: organizationName ? organizationName.trim() : '',
      facebookUrl: facebookUrl ? facebookUrl.trim() : '',
      twitterHandle: twitterHandle ? twitterHandle.trim() : '',
      instagramHandle: instagramHandle ? instagramHandle.trim() : '',
      linkedinUrl: linkedinUrl ? linkedinUrl.trim() : '',
      emailOptIn: emailOptIn !== undefined ? emailOptIn : true
    };

    const organizer = new Organizer(organizerData);
    await organizer.save();

    res.status(201).json({
      success: true,
      message: 'Organizer profile created successfully',
      profile: organizer.getFullProfile()
    });

  } catch (error) {
    console.error('Organizer profile creation error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Organizer profile already exists for this user'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create organizer profile'
    });
  }
});

// Update organizer profile
router.put('/profile/:profileId', authenticateToken, async (req, res) => {
  try {
    const { profileId } = req.params;
    const userId = req.user._id.toString();
    
    // Find existing profile
    const organizer = await Organizer.findById(profileId);
    
    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer profile not found'
      });
    }

    // Check permissions - user can only update their own profile (or admin)
    if (organizer.userId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only update your own profile'
      });
    }

    // Validate required fields
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Organizer name is required'
      });
    }

    // Update fields
    const allowedFields = [
      'name', 'bio', 'website', 'contactEmail', 'phone', 'address', 
      'organizationName', 'facebookUrl', 'twitterHandle', 'instagramHandle', 
      'linkedinUrl', 'emailOptIn'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] === 'string') {
          organizer[field] = req.body[field].trim();
        } else {
          organizer[field] = req.body[field];
        }
      }
    });

    // Ensure contactEmail is lowercase
    if (organizer.contactEmail) {
      organizer.contactEmail = organizer.contactEmail.toLowerCase();
    }

    await organizer.save();

    res.json({
      success: true,
      message: 'Organizer profile updated successfully',
      profile: organizer.getFullProfile()
    });

  } catch (error) {
    console.error('Organizer profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organizer profile'
    });
  }
});

// Delete (deactivate) organizer profile
router.delete('/profile/:profileId', authenticateToken, async (req, res) => {
  try {
    const { profileId } = req.params;
    const userId = req.user._id.toString();
    
    const organizer = await Organizer.findById(profileId);
    
    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer profile not found'
      });
    }

    // Check permissions
    if (organizer.userId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete your own profile'
      });
    }

    // Soft delete by setting isActive to false
    organizer.isActive = false;
    await organizer.save();

    res.json({
      success: true,
      message: 'Organizer profile deactivated successfully'
    });

  } catch (error) {
    console.error('Organizer profile deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate organizer profile'
    });
  }
});

// Get all organizer profiles (public, paginated)
router.get('/profiles', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const organizers = await Organizer.find({ isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Organizer.countDocuments({ isActive: true });

    res.json({
      success: true,
      profiles: organizers.map(org => org.getPublicProfile()),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProfiles: total,
        limit
      }
    });

  } catch (error) {
    console.error('Organizer profiles fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizer profiles'
    });
  }
});

// Search organizer profiles
router.get('/profiles/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const searchRegex = new RegExp(query, 'i');
    
    const organizers = await Organizer.find({
      isActive: true,
      $or: [
        { name: { $regex: searchRegex } },
        { organizationName: { $regex: searchRegex } },
        { bio: { $regex: searchRegex } }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Organizer.countDocuments({
      isActive: true,
      $or: [
        { name: { $regex: searchRegex } },
        { organizationName: { $regex: searchRegex } },
        { bio: { $regex: searchRegex } }
      ]
    });

    res.json({
      success: true,
      profiles: organizers.map(org => org.getPublicProfile()),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProfiles: total,
        limit
      },
      searchQuery: query
    });

  } catch (error) {
    console.error('Organizer profiles search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search organizer profiles'
    });
  }
});

module.exports = router;