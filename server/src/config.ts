/**
 * This file is required to make sure that the ENV variables are loaded before
 * being accessed via process.env.
 */

import * as dotenv from 'dotenv';

// Read ENV variables
dotenv.config();

// Read local ENV variables
dotenv.config({ path: '.env.local' });
