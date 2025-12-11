import { Test, TestingModule } from '@nestjs/testing';
import { IncidentWorkflowService } from './incident-workflow.service';
import { IncidentStatus, IncidentPriority } from '../entities/incident.entity';

describe('IncidentWorkflowService', () => {
  let service: IncidentWorkflowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IncidentWorkflowService],
    }).compile();

    service = module.get<IncidentWorkflowService>(IncidentWorkflowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateStatusTransition', () => {
    it('should allow valid transitions from OPEN', () => {
      expect(
        service.validateStatusTransition(IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS),
      ).toBe(true);
      expect(service.validateStatusTransition(IncidentStatus.OPEN, IncidentStatus.RESOLVED)).toBe(
        true,
      );
      expect(service.validateStatusTransition(IncidentStatus.OPEN, IncidentStatus.CLOSED)).toBe(
        true,
      );
    });

    it('should disallow invalid transitions from OPEN', () => {
      expect(service.validateStatusTransition(IncidentStatus.OPEN, IncidentStatus.OPEN)).toBe(
        false,
      );
    });

    it('should disallow all transitions from CLOSED', () => {
      expect(service.validateStatusTransition(IncidentStatus.CLOSED, IncidentStatus.OPEN)).toBe(
        false,
      );
      expect(
        service.validateStatusTransition(IncidentStatus.CLOSED, IncidentStatus.IN_PROGRESS),
      ).toBe(false);
      expect(service.validateStatusTransition(IncidentStatus.CLOSED, IncidentStatus.RESOLVED)).toBe(
        false,
      );
    });

    it('should allow transition from RESOLVED to CLOSED', () => {
      expect(service.validateStatusTransition(IncidentStatus.RESOLVED, IncidentStatus.CLOSED)).toBe(
        true,
      );
    });
  });

  describe('calculateSlaDeadline', () => {
    const now = new Date();

    it('should calculate 4 hours for CRITICAL priority', () => {
      const deadline = service.calculateSlaDeadline(IncidentPriority.CRITICAL, now);
      const hours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(Math.abs(hours - 4) < 0.1).toBe(true);
    });

    it('should calculate 24 hours for HIGH priority', () => {
      const deadline = service.calculateSlaDeadline(IncidentPriority.HIGH, now);
      const hours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(Math.abs(hours - 24) < 0.1).toBe(true);
    });

    it('should calculate 48 hours for MEDIUM priority', () => {
      const deadline = service.calculateSlaDeadline(IncidentPriority.MEDIUM, now);
      const hours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(Math.abs(hours - 48) < 0.1).toBe(true);
    });

    it('should calculate 72 hours for LOW priority', () => {
      const deadline = service.calculateSlaDeadline(IncidentPriority.LOW, now);
      const hours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(Math.abs(hours - 72) < 0.1).toBe(true);
    });
  });

  describe('isSlaBreached', () => {
    it('should return true when deadline has passed', () => {
      const pastDeadline = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      expect(service.isSlaBreached(pastDeadline)).toBe(true);
    });

    it('should return false when deadline is in the future', () => {
      const futureDeadline = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
      expect(service.isSlaBreached(futureDeadline)).toBe(false);
    });
  });

  describe('canEscalate', () => {
    it('should return true when not escalated and not critical', () => {
      expect(service.canEscalate(null, IncidentPriority.LOW)).toBe(true);
      expect(service.canEscalate(null, IncidentPriority.MEDIUM)).toBe(true);
      expect(service.canEscalate(null, IncidentPriority.HIGH)).toBe(true);
    });

    it('should return false when already escalated', () => {
      const escalatedDate = new Date();
      expect(service.canEscalate(escalatedDate, IncidentPriority.LOW)).toBe(false);
    });

    it('should return false when critical priority', () => {
      expect(service.canEscalate(null, IncidentPriority.CRITICAL)).toBe(false);
    });
  });

  describe('getEscalationPriority', () => {
    it('should escalate LOW to MEDIUM', () => {
      expect(service.getEscalationPriority(IncidentPriority.LOW)).toBe(IncidentPriority.MEDIUM);
    });

    it('should escalate MEDIUM to HIGH', () => {
      expect(service.getEscalationPriority(IncidentPriority.MEDIUM)).toBe(IncidentPriority.HIGH);
    });

    it('should escalate HIGH to CRITICAL', () => {
      expect(service.getEscalationPriority(IncidentPriority.HIGH)).toBe(IncidentPriority.CRITICAL);
    });

    it('should stay at CRITICAL when already critical', () => {
      expect(service.getEscalationPriority(IncidentPriority.CRITICAL)).toBe(
        IncidentPriority.CRITICAL,
      );
    });
  });

  describe('validateResolutionChecklist', () => {
    it('should return true for empty or null checklist', () => {
      expect(service.validateResolutionChecklist(null)).toBe(true);
      expect(service.validateResolutionChecklist(undefined)).toBe(true);
      expect(service.validateResolutionChecklist([])).toBe(true);
    });

    it('should return true when all items are completed', () => {
      const checklist = [
        { item: 'Task 1', completed: true },
        { item: 'Task 2', completed: true },
      ];
      expect(service.validateResolutionChecklist(checklist)).toBe(true);
    });

    it('should return false when any item is not completed', () => {
      const checklist = [
        { item: 'Task 1', completed: true },
        { item: 'Task 2', completed: false },
      ];
      expect(service.validateResolutionChecklist(checklist)).toBe(false);
    });
  });

  describe('canTransitionToResolved', () => {
    it('should allow transition when checklist is completed', () => {
      const checklist = [
        { item: 'Task 1', completed: true },
        { item: 'Task 2', completed: true },
      ];
      expect(service.canTransitionToResolved(checklist)).toBe(true);
    });

    it('should disallow transition when checklist is incomplete', () => {
      const checklist = [
        { item: 'Task 1', completed: true },
        { item: 'Task 2', completed: false },
      ];
      expect(service.canTransitionToResolved(checklist)).toBe(false);
    });
  });

  describe('canClose', () => {
    it('should allow closing only resolved incidents', () => {
      expect(service.canClose(IncidentStatus.RESOLVED)).toBe(true);
      expect(service.canClose(IncidentStatus.OPEN)).toBe(false);
      expect(service.canClose(IncidentStatus.IN_PROGRESS)).toBe(false);
      expect(service.canClose(IncidentStatus.CLOSED)).toBe(false);
    });
  });

  describe('calculateIncidentAge', () => {
    it('should calculate correct age in hours', () => {
      const createdAt = new Date(Date.now() - 5 * 60 * 60 * 1000); // 5 hours ago
      const age = service.calculateIncidentAge(createdAt);
      expect(age).toBe(5);
    });

    it('should handle very recent incidents', () => {
      const createdAt = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      const age = service.calculateIncidentAge(createdAt);
      expect(age).toBe(0);
    });
  });

  describe('shouldAutoEscalate', () => {
    it('should escalate when SLA is breached and conditions are met', () => {
      const pastDeadline = new Date(Date.now() - 1000);
      const shouldEscalate = service.shouldAutoEscalate(
        IncidentStatus.OPEN,
        pastDeadline,
        null,
        IncidentPriority.HIGH,
      );
      expect(shouldEscalate).toBe(true);
    });

    it('should not escalate when SLA is not breached', () => {
      const futureDeadline = new Date(Date.now() + 1000 * 60 * 60);
      const shouldEscalate = service.shouldAutoEscalate(
        IncidentStatus.OPEN,
        futureDeadline,
        null,
        IncidentPriority.HIGH,
      );
      expect(shouldEscalate).toBe(false);
    });

    it('should not escalate when already escalated', () => {
      const pastDeadline = new Date(Date.now() - 1000);
      const escalatedAt = new Date();
      const shouldEscalate = service.shouldAutoEscalate(
        IncidentStatus.OPEN,
        pastDeadline,
        escalatedAt,
        IncidentPriority.HIGH,
      );
      expect(shouldEscalate).toBe(false);
    });

    it('should not escalate closed incidents', () => {
      const pastDeadline = new Date(Date.now() - 1000);
      const shouldEscalate = service.shouldAutoEscalate(
        IncidentStatus.CLOSED,
        pastDeadline,
        null,
        IncidentPriority.HIGH,
      );
      expect(shouldEscalate).toBe(false);
    });

    it('should not escalate critical incidents', () => {
      const pastDeadline = new Date(Date.now() - 1000);
      const shouldEscalate = service.shouldAutoEscalate(
        IncidentStatus.OPEN,
        pastDeadline,
        null,
        IncidentPriority.CRITICAL,
      );
      expect(shouldEscalate).toBe(false);
    });
  });
});
