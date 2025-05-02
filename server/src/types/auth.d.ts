import { Request, Response } from 'express';
import { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user: IUser;
}

export type MockRequest = {
  [K in keyof Request]?: K extends 'header' 
    ? jest.Mock<string | undefined, [string]> 
    : K extends 'user' 
    ? IUser 
    : Request[K];
};

export type MockResponse = {
  [K in keyof Response]?: K extends 'status' | 'json' | 'send'
    ? jest.Mock<MockResponse, [any]>
    : Response[K];
}; 