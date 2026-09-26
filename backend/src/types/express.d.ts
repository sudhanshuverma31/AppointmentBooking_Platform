import { IUser } from '../models/User.js';
import { IOwner } from '../models/Owner.js';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      owner?: IOwner;
    }
  }
}
