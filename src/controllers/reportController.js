const getProjectReport = async (req, res) => {
  const { id } = req.params;

  // summary
  const [summary] = await db.query(`
    SELECT 
      COUNT(*) as total,
      SUM(status='sent') as sent,
      SUM(status='delivered') as delivered,
      SUM(status='opened') as opened
    FROM email_logs
    WHERE project_id = ?
  `, [id]);

  // table data
  const [logs] = await db.query(`
    SELECT * FROM email_logs 
    WHERE project_id = ?
    ORDER BY created_at DESC
  `, [id]);

  res.json({
    summary: summary[0],
    logs
  });
};

module.exports={
    getProjectReport
}