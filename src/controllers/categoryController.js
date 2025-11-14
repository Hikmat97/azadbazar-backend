const { Category } = require('../models');

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true, parentId: null },
      include: [{
        model: Category,
        as: 'subcategories',
        where: { isActive: true },
        required: false
      }],
      order: [['order', 'ASC']]
    });

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Get category by ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findByPk(id, {
      include: [{
        model: Category,
        as: 'subcategories',
        where: { isActive: true },
        required: false
      }]
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

module.exports = {
  getCategories,
  getCategoryById
};