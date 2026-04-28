router.get("/open/:id", async (req, res) => {
  const { id } = req.params;

  await db.query(
    `UPDATE email_logs 
     SET status='opened', opened_at=NOW() 
     WHERE id=?`,
    [id]
  );

  // 1px invisible image
  const img = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6n9sQAAAAASUVORK5CYII=",
    "base64"
  );

  res.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Length": img.length,
  });
  res.end(img);
});

module.exports=router