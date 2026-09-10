#!/usr/bin/env node

import { reportCliError } from './errors/report-cli-error.js';
import { createProgram } from './program.js';

createProgram().parseAsync().catch(reportCliError);
