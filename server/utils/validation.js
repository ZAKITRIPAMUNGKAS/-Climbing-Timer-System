const { z } = require('zod');

// Validation schemas for input validation

// Time validation: must be non-negative number
const timeSchema = z.number()
    .nonnegative('Time must be non-negative')
    .max(999.99, 'Time must be less than 1000 seconds');

// Status validation for Speed Climbing
const speedStatusSchema = z.enum(['VALID', 'FALL', 'FALSE_START', 'DNS'], {
    errorMap: () => ({ message: 'Status must be VALID, FALL, FALSE_START, or DNS' })
});

// Bib number validation
const bibNumberSchema = z.number()
    .int('Bib number must be an integer')
    .positive('Bib number must be positive');

// Name validation (sanitized)
const nameSchema = z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim()
    .refine(val => val.length > 0, 'Name cannot be empty');

// Team validation (optional)
const teamSchema = z.string()
    .max(255, 'Team name must be less than 255 characters')
    .trim()
    .optional()
    .nullable();

// Speed Qualification Score Schema
const speedQualificationScoreSchema = z.object({
    lane_a_time: timeSchema.nullable().optional(),
    lane_b_time: timeSchema.nullable().optional(),
    lane_a_status: speedStatusSchema,
    lane_b_status: speedStatusSchema
});

// Speed Finals Score Schema (Legacy - single run)
const speedFinalsScoreSchema = z.object({
    time_a: timeSchema.nullable().optional(),
    time_b: timeSchema.nullable().optional(),
    status_a: speedStatusSchema,
    status_b: speedStatusSchema
});

// Speed Classic Finals Score Schema (Two runs per climber)
const speedClassicFinalsScoreSchema = z.object({
    // Climber A runs
    climber_a_run1_time: timeSchema.nullable().optional(),
    climber_a_run2_time: timeSchema.nullable().optional(),
    climber_a_run1_status: speedStatusSchema.optional().default('VALID'),
    climber_a_run2_status: speedStatusSchema.optional().default('VALID'),
    // Climber B runs
    climber_b_run1_time: timeSchema.nullable().optional(),
    climber_b_run2_time: timeSchema.nullable().optional(),
    climber_b_run1_status: speedStatusSchema.optional().default('VALID'),
    climber_b_run2_status: speedStatusSchema.optional().default('VALID')
});

// Boulder Score Action Schema
const boulderScoreActionSchema = z.object({
    action: z.enum(['attempt', 'zone', 'top', 'finalize', 'disqualify'], {
        errorMap: () => ({ message: 'Action must be attempt, zone, top, finalize, or disqualify' })
    })
});

// Generate Bracket Schema
const generateBracketSchema = z.object({
    topCount: z.number().int().min(2).max(16).optional().default(8)
});

// Unlock/Appeal Schema
const unlockScoreSchema = z.object({
    reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must be less than 500 characters'),
    entity_type: z.enum(['boulder_score', 'speed_qualification', 'speed_final']),
    entity_id: z.number().int().positive()
});

// Validation middleware factory
function validate(schema) {
    return (req, res, next) => {
        try {
            // Validate body (params and query are usually validated separately if needed)
            const validated = schema.parse(req.body);
            
            // Replace body with validated data
            req.body = validated;
            
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.errors.map(e => ({
                        path: e.path.join('.'),
                        message: e.message
                    }))
                });
            }
            next(error);
        }
    };
}

// Sanitize string input (prevent injection)
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/['";\\]/g, ''); // Remove SQL injection characters
}

module.exports = {
    timeSchema,
    speedStatusSchema,
    bibNumberSchema,
    nameSchema,
    teamSchema,
    speedQualificationScoreSchema,
    speedFinalsScoreSchema,
    speedClassicFinalsScoreSchema,
    boulderScoreActionSchema,
    generateBracketSchema,
    unlockScoreSchema,
    validate,
    sanitizeString
};

