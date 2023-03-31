import { Request, Response } from 'express';

/**
 * Return Cast App ID.
 *
 * @param {Request} req
 * @param {Response} res
 */
function getCastAppId(req: Request, res: Response) {
  res.status(200).send({ castAppId: process.env.CAST_APP_ID });
}

export default {
  getCastAppId,
};
