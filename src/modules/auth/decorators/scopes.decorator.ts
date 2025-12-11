import { SetMetadata } from '@nestjs/common';
import { AuthScope } from '../constants/scopes.constant';

export const SCOPES_KEY = 'required_scopes';
export const Scopes = (...scopes: AuthScope[]) => SetMetadata(SCOPES_KEY, scopes);
