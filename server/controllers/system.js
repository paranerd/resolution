/**
 * Return Cast App ID.
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
function getCastAppId(req, res) {
  res.status(200).send({ castAppId: process.env.CAST_APP_ID });
}

module.exports = {
  getCastAppId,
};
