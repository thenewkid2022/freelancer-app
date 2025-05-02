import User from './User';
import Project from './Project';
import TimeEntry from './TimeEntry';
import Payment from './Payment';
import Notification from './Notification';

export const UserModel = User.model;
export const ProjectModel = Project.model;
export const TimeEntryModel = TimeEntry.model;
export const PaymentModel = Payment.model;
export const NotificationModel = Notification.model;

export {
  UserModel as User,
  ProjectModel as Project,
  TimeEntryModel as TimeEntry,
  PaymentModel as Payment,
  NotificationModel as Notification
}; 