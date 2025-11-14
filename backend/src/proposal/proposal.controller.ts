import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ProposalService } from './proposal.service';
import {
  CreateProposalDto,
  UpdateProposalDto,
  RespondToProposalDto,
} from './dto/proposal.dto';

@Controller('proposals')
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post()
  async createProposal(@Body() createDto: CreateProposalDto) {
    return this.proposalService.createProposal(createDto);
  }

  @Get(':proposalId')
  async getProposal(@Param('proposalId') proposalId: string) {
    return this.proposalService.getProposal(proposalId);
  }

  @Get('client/:clientId')
  async getProposalsForClient(
    @Param('clientId') clientId: string,
    @Query('status') status?: string,
  ) {
    return this.proposalService.getProposalsForClient(clientId, status);
  }

  @Get('contractor/:contractorId')
  async getProposalsForContractor(
    @Param('contractorId') contractorId: string,
    @Query('status') status?: string,
  ) {
    return this.proposalService.getProposalsForContractor(contractorId, status);
  }

  @Patch(':proposalId/respond')
  async respondToProposal(
    @Param('proposalId') proposalId: string,
    @Body() respondDto: RespondToProposalDto,
  ) {
    return this.proposalService.respondToProposal(proposalId, respondDto);
  }

  @Put(':proposalId')
  async updateProposal(
    @Param('proposalId') proposalId: string,
    @Body() updateDto: UpdateProposalDto,
  ) {
    return this.proposalService.updateProposal(proposalId, updateDto);
  }

  @Patch(':proposalId/cancel')
  async cancelProposal(
    @Param('proposalId') proposalId: string,
    @Body() body: { user_id: string },
  ) {
    return this.proposalService.cancelProposal(proposalId, body.user_id);
  }

  @Post('expire-old')
  async expireOldProposals() {
    return this.proposalService.expireOldProposals();
  }
}
