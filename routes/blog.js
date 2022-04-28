const express = require("express");
const router = express.Router();
const {
  create,
  list,
  listAllBlogsCategoriesTags,
  read,
  remove,
  update,
  photo,
  listRelated,
  listSearch,
  like,
  unlike,
  toplist,
  listByUser
} = require("../controllers/blog");

const { requireSignin, adminMiddleware, authorMiddleware,canUpdateDeleteBlog } = require("../controllers/auth");

router.post("/blog", requireSignin, adminMiddleware, create);
router.get("/blogs", list);
router.get("/blogs/toplist", toplist);
// like - unlike
router.put("/blog/like", requireSignin, like);
router.put("/blog/unlike", requireSignin, unlike);

router.post("/blogs/related", listRelated);
router.get("/blogs/search/", listSearch);
router.post("/blogs-categories-tags", listAllBlogsCategoriesTags);
router.get("/blog/:slug", read);
router.delete("/blog/:slug", requireSignin, adminMiddleware, remove);
router.put("/blog/:slug", requireSignin, adminMiddleware, update);
router.get("/blog/photo/:slug", photo);


// author blog crud
router.post("/user/blog", requireSignin, authorMiddleware, create);
router.get("/:username/blogs", listByUser);
router.delete("/user/blog/:slug", requireSignin, authorMiddleware,canUpdateDeleteBlog, remove);
router.put("/user/blog/:slug", requireSignin, authorMiddleware,canUpdateDeleteBlog, update);


module.exports = router;
