package com.smartliving.module4complaints.model;

/**
 * Priority level assigned to a complaint.
 * Affects how quickly staff should respond.
 */
public enum ComplaintPriority {

    /** Routine issue — no urgency. */
    LOW,

    /** Standard issue — respond within SLA. */
    MEDIUM,

    /** Significant disruption — prioritise promptly. */
    HIGH,

    /** Safety hazard or service outage — escalate immediately. */
    CRITICAL
}
