import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { IncidentsService } from './incidents.service';
import { IncidentWorkflowService } from './services/incident-workflow.service';
import { Incident, IncidentStatus, IncidentPriority } from './entities/incident.entity';
import { IncidentAnnotation } from './entities/incident-annotation.entity';
import { IncidentEvidenceLink } from './entities/incident-evidence-link.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';

describe('IncidentsService', () => {
  let service: IncidentsService;
  let mockIncidentRepository: any;
  let mockAnnotationRepository: any;
  let mockEvidenceLinkRepository: any;
  let mockQueue: any;
  let mockWorkflowService: any;

  beforeEach(async () => {
    mockIncidentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockAnnotationRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    mockEvidenceLinkRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    mockQueue = {
      add: jest.fn().mockResolvedValue({}),
    };

    mockWorkflowService = {
      calculateSlaDeadline: jest.fn(),
      validateStatusTransition: jest.fn(),
      validateResolutionChecklist: jest.fn(),
      canClose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        {
          provide: getRepositoryToken(Incident),
          useValue: mockIncidentRepository,
        },
        {
          provide: getRepositoryToken(IncidentAnnotation),
          useValue: mockAnnotationRepository,
        },
        {
          provide: getRepositoryToken(IncidentEvidenceLink),
          useValue: mockEvidenceLinkRepository,
        },
        {
          provide: getQueueToken('incidents'),
          useValue: mockQueue,
        },
        {
          provide: IncidentWorkflowService,
          useValue: mockWorkflowService,
        },
      ],
    }).compile();

    service = module.get<IncidentsService>(IncidentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an incident with SLA deadline', async () => {
      const createDto: CreateIncidentDto = {
        title: 'Test Incident',
        description: 'Test Description',
        priority: IncidentPriority.HIGH,
      };

      const slaDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
      mockWorkflowService.calculateSlaDeadline.mockReturnValue(slaDeadline);

      const incident = {
        id: '123',
        ...createDto,
        slaDeadline,
        assignees: [],
        status: IncidentStatus.OPEN,
        annotations: [],
        evidenceLinks: [],
      };

      mockIncidentRepository.create.mockReturnValue(incident);
      mockIncidentRepository.save.mockResolvedValue(incident);
      mockIncidentRepository.findOne.mockResolvedValue(incident);

      const result = await service.create(createDto);

      expect(mockWorkflowService.calculateSlaDeadline).toHaveBeenCalledWith(IncidentPriority.HIGH);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-incident',
        expect.objectContaining({
          incidentId: '123',
          priority: IncidentPriority.HIGH,
        }),
        { delay: 0 },
      );
      expect(result).toEqual(incident);
    });

    it('should add assignee to assignees array', async () => {
      const createDto: CreateIncidentDto = {
        title: 'Test Incident',
        description: 'Test Description',
        priority: IncidentPriority.MEDIUM,
        assignedTo: 'user-1',
      };

      const slaDeadline = new Date();
      mockWorkflowService.calculateSlaDeadline.mockReturnValue(slaDeadline);

      const incident = {
        id: '123',
        ...createDto,
        slaDeadline,
        assignees: ['user-1'],
        status: IncidentStatus.OPEN,
        annotations: [],
        evidenceLinks: [],
      };

      mockIncidentRepository.create.mockReturnValue(incident);
      mockIncidentRepository.save.mockResolvedValue(incident);
      mockIncidentRepository.findOne.mockResolvedValue(incident);

      await service.create(createDto);

      expect(mockIncidentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          assignees: ['user-1'],
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an incident with relations', async () => {
      const incident = {
        id: '123',
        title: 'Test',
        annotations: [],
        evidenceLinks: [],
      };

      mockIncidentRepository.findOne.mockResolvedValue(incident);

      const result = await service.findOne('123');

      expect(mockIncidentRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
        relations: ['annotations', 'evidenceLinks'],
      });
      expect(result).toEqual(incident);
    });

    it('should throw NotFoundException when incident not found', async () => {
      mockIncidentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should validate status transition', async () => {
      const incident = {
        id: '123',
        status: IncidentStatus.OPEN,
        priority: IncidentPriority.MEDIUM,
        resolutionChecklist: null,
      };

      mockIncidentRepository.findOne.mockResolvedValue(incident);
      mockWorkflowService.validateStatusTransition.mockReturnValue(false);

      const updateDto = { status: IncidentStatus.CLOSED };

      await expect(service.update('123', updateDto)).rejects.toThrow(BadRequestException);
    });

    it('should set resolvedAt when transitioning to RESOLVED', async () => {
      const incident = {
        id: '123',
        status: IncidentStatus.OPEN,
        resolvedAt: null,
        priority: IncidentPriority.MEDIUM,
        resolutionChecklist: null,
      };

      mockIncidentRepository.findOne.mockResolvedValue(incident);
      mockWorkflowService.validateStatusTransition.mockReturnValue(true);
      mockWorkflowService.validateResolutionChecklist.mockReturnValue(true);

      const updateDto = { status: IncidentStatus.RESOLVED };
      await service.update('123', updateDto);

      expect(mockIncidentRepository.update).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          resolvedAt: expect.any(Date),
        }),
      );
    });

    it('should validate resolution checklist before resolving', async () => {
      const incident = {
        id: '123',
        status: IncidentStatus.OPEN,
        priority: IncidentPriority.MEDIUM,
        resolutionChecklist: [{ item: 'Task 1', completed: false }],
      };

      mockIncidentRepository.findOne.mockResolvedValue(incident);
      mockWorkflowService.validateStatusTransition.mockReturnValue(true);
      mockWorkflowService.validateResolutionChecklist.mockReturnValue(false);

      const updateDto = { status: IncidentStatus.RESOLVED };

      await expect(service.update('123', updateDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('acknowledge', () => {
    it('should acknowledge an incident', async () => {
      const incident = {
        id: '123',
        acknowledgedAt: null,
      };

      mockIncidentRepository.findOne.mockResolvedValue(incident);

      await service.acknowledge('123', 'user-1');

      expect(mockIncidentRepository.update).toHaveBeenCalledWith('123', {
        acknowledgedAt: expect.any(Date),
        acknowledgedBy: 'user-1',
      });
    });

    it('should throw error if already acknowledged', async () => {
      const incident = {
        id: '123',
        acknowledgedAt: new Date(),
      };

      mockIncidentRepository.findOne.mockResolvedValue(incident);

      await expect(service.acknowledge('123', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('createAnnotation', () => {
    it('should create annotation and queue notification', async () => {
      const incident = { id: '123' };
      mockIncidentRepository.findOne.mockResolvedValue(incident);

      const annotation = {
        id: 'ann-1',
        incidentId: '123',
        userId: 'user-1',
        content: 'Test annotation',
      };

      mockAnnotationRepository.create.mockReturnValue(annotation);
      mockAnnotationRepository.save.mockResolvedValue(annotation);

      const result = await service.createAnnotation(
        '123',
        { content: 'Test annotation' },
        'user-1',
      );

      expect(mockAnnotationRepository.save).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith(
        'notify-annotation',
        expect.objectContaining({
          incidentId: '123',
          userId: 'user-1',
        }),
        { delay: 0 },
      );
      expect(result).toEqual(annotation);
    });
  });

  describe('getStats', () => {
    it('should return incident statistics', async () => {
      const incidents = [
        { status: IncidentStatus.OPEN, priority: IncidentPriority.HIGH },
        { status: IncidentStatus.OPEN, priority: IncidentPriority.MEDIUM },
        { status: IncidentStatus.IN_PROGRESS, priority: IncidentPriority.HIGH },
      ];

      mockIncidentRepository.find.mockResolvedValue(incidents);

      const stats = await service.getStats();

      expect(stats).toEqual({
        total: 3,
        byStatus: {
          [IncidentStatus.OPEN]: 2,
          [IncidentStatus.IN_PROGRESS]: 1,
        },
        byPriority: {
          [IncidentPriority.HIGH]: 2,
          [IncidentPriority.MEDIUM]: 1,
        },
      });
    });
  });
});
