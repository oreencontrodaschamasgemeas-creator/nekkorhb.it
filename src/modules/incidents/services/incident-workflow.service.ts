import { Injectable, Logger } from '@nestjs/common';
import { IncidentStatus, IncidentPriority } from '../entities/incident.entity';

@Injectable()
export class IncidentWorkflowService {
  private readonly logger = new Logger(IncidentWorkflowService.name);

  // Define valid status transitions
  private readonly validTransitions: Record<IncidentStatus, IncidentStatus[]> = {
    [IncidentStatus.OPEN]: [
      IncidentStatus.IN_PROGRESS,
      IncidentStatus.RESOLVED,
      IncidentStatus.CLOSED,
    ],
    [IncidentStatus.IN_PROGRESS]: [
      IncidentStatus.RESOLVED,
      IncidentStatus.OPEN,
      IncidentStatus.CLOSED,
    ],
    [IncidentStatus.RESOLVED]: [IncidentStatus.CLOSED, IncidentStatus.OPEN],
    [IncidentStatus.CLOSED]: [],
  };

  validateStatusTransition(currentStatus: IncidentStatus, newStatus: IncidentStatus): boolean {
    return this.validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  calculateSlaDeadline(priority: IncidentPriority, fromDate: Date = new Date()): Date {
    const slaDurations: Record<IncidentPriority, number> = {
      [IncidentPriority.LOW]: 72, // 72 hours
      [IncidentPriority.MEDIUM]: 48, // 48 hours
      [IncidentPriority.HIGH]: 24, // 24 hours
      [IncidentPriority.CRITICAL]: 4, // 4 hours
    };

    const hours = slaDurations[priority];
    const deadline = new Date(fromDate);
    deadline.setHours(deadline.getHours() + hours);
    return deadline;
  }

  isSlaBreached(slaDeadline: Date, referenceDate: Date = new Date()): boolean {
    return slaDeadline < referenceDate;
  }

  canEscalate(escalatedAt: Date | null, priority: IncidentPriority): boolean {
    // Don't escalate if already escalated
    if (escalatedAt) {
      return false;
    }

    // Only escalate if not critical
    return priority !== IncidentPriority.CRITICAL;
  }

  getEscalationPriority(currentPriority: IncidentPriority): IncidentPriority {
    const escalation: Record<IncidentPriority, IncidentPriority> = {
      [IncidentPriority.LOW]: IncidentPriority.MEDIUM,
      [IncidentPriority.MEDIUM]: IncidentPriority.HIGH,
      [IncidentPriority.HIGH]: IncidentPriority.CRITICAL,
      [IncidentPriority.CRITICAL]: IncidentPriority.CRITICAL,
    };

    return escalation[currentPriority];
  }

  validateResolutionChecklist(
    checklist: { item: string; completed: boolean }[] | null | undefined,
  ): boolean {
    if (!checklist || checklist.length === 0) {
      return true;
    }

    return checklist.every((item) => item.completed);
  }

  canTransitionToResolved(
    checklist: { item: string; completed: boolean }[] | null | undefined,
  ): boolean {
    return this.validateResolutionChecklist(checklist);
  }

  canClose(status: IncidentStatus): boolean {
    return status === IncidentStatus.RESOLVED;
  }

  calculateIncidentAge(createdAt: Date, referenceDate: Date = new Date()): number {
    return Math.floor((referenceDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
  }

  shouldAutoEscalate(
    status: IncidentStatus,
    slaDeadline: Date,
    escalatedAt: Date | null,
    priority: IncidentPriority,
  ): boolean {
    // Only auto-escalate if still open or in progress
    if (![IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS].includes(status)) {
      return false;
    }

    // Check if SLA is breached
    if (!this.isSlaBreached(slaDeadline)) {
      return false;
    }

    // Check if not already escalated
    if (escalatedAt) {
      return false;
    }

    // Check if can escalate
    return this.canEscalate(escalatedAt, priority);
  }
}
