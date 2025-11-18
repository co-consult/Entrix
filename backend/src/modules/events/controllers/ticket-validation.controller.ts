import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TicketValidationService, ValidationRequest } from '../services/ticket-validation.service';

@ApiTags('Ticket Validation')
@Controller('tickets')
export class TicketValidationController {
  constructor(private readonly ticketValidationService: TicketValidationService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validate a ticket or subscription QR code' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async validateTicket(@Body() validationRequest: ValidationRequest) {
    return this.ticketValidationService.validateTicket(validationRequest);
  }

  @Get(':qrCode')
  @ApiOperation({ summary: 'Get ticket details by QR code' })
  @ApiResponse({ status: 200, description: 'Ticket details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getTicketDetails(@Param('qrCode') qrCode: string) {
    return this.ticketValidationService.getTicketDetails(qrCode);
  }

  @Get('events/:eventId/validations/recent')
  @ApiOperation({ summary: 'Get recent validations for an event' })
  @ApiResponse({ status: 200, description: 'Recent validations retrieved successfully' })
  async getRecentValidations(
    @Param('eventId') eventId: string,
    @Query('limit') limit: string = '10',
  ) {
    return this.ticketValidationService.getRecentValidations(eventId, parseInt(limit));
  }

  @Get('events/:eventId/validations/history')
  @ApiOperation({ summary: 'Get validation history for an event on a specific date' })
  @ApiResponse({ status: 200, description: 'Validation history retrieved successfully' })
  async getValidationHistory(
    @Param('eventId') eventId: string,
    @Query('date') date: string,
  ) {
    return this.ticketValidationService.getValidationHistory(eventId, date);
  }
}
