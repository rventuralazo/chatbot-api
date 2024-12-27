import { unlinkSync, writeFileSync } from 'fs';

export const createTempFileFromMulter = (file: Express.Multer.File) => {
  writeFileSync(`/tmp/${file.originalname}`, file.buffer);
  const destroy = () => {
    unlinkSync(`/tmp/${file.originalname}`);
  };
  const filepath = `/tmp/${file.originalname}`;
  return { destroy, filepath };
};
