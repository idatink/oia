import { IntentAgent } from '../agents/intent.js';
import { StubClinicRepository, type ClinicRepository } from '../repository/clinic.js';
import {
  formatClinicResults,
  formatEscalationMessage,
  formatUnknownIntentMessage,
} from '../formatters/whatsapp.js';

export interface PipelineInput {
  from: string;
  body: string;
  mediaUrl?: string;
}

export interface PipelineOutput {
  replyText: string;
  escalate: boolean;
  intent: {
    procedure: string | null;
    location: string | null;
    stage: string;
  };
}

export class IntentPipeline {
  private intentAgent: IntentAgent;
  private clinicRepo: ClinicRepository;

  constructor(clinicRepo: ClinicRepository = new StubClinicRepository()) {
    this.intentAgent = new IntentAgent();
    this.clinicRepo = clinicRepo;
  }

  async run(input: PipelineInput): Promise<PipelineOutput> {
    const intent = await this.intentAgent.parse(input.body);

    if (intent.needsEscalation) {
      return {
        replyText: formatEscalationMessage(),
        escalate: true,
        intent,
      };
    }

    if (!intent.procedure && !intent.location && !intent.isImageMatch) {
      return {
        replyText: formatUnknownIntentMessage(),
        escalate: false,
        intent,
      };
    }

    const clinics = await this.clinicRepo.findByProcedureAndLocation(
      intent.procedure,
      intent.location,
    );

    return {
      replyText: formatClinicResults(intent, clinics),
      escalate: false,
      intent,
    };
  }
}
