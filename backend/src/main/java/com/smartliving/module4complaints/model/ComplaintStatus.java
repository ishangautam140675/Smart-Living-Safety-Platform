package com.smartliving.module4complaints.model;

/**
 * Lifecycle states of a complaint from submission to resolution.
 */
public enum ComplaintStatus {

    /** Newly submitted; not yet reviewed by staff. */
    OPEN,

    /** Acknowledged; a staff member is actively working on it. */
    IN_PROGRESS,

    /** Work is complete; pending resident confirmation. */
    RESOLVED,

    /** Fully closed — either confirmed resolved or auto-closed. */
    CLOSED,

    /** Rejected by admin (duplicate, invalid, out-of-scope). */
    REJECTED
}
