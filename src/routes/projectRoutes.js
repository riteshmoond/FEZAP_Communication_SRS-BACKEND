// routes/projectRoutes.js
const express = require("express");
const { createProject, getProjects, getProjectById, updateProject, updateProjectStatus } = require("../controllers/projectController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();



router.post('/projects',authMiddleware,createProject)
router.put('/projects/:id',authMiddleware,updateProject)
router.patch('/projects/:id/status',authMiddleware,updateProjectStatus)
router.get('/projects',authMiddleware,getProjects)
router.get('/projects/:id',authMiddleware,getProjectById)

module.exports = router;