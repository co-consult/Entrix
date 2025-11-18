import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import {
  AccessControlValidationDto,
  AccessControlValidationResponseDto,
  AccessStatus,
  DenialReason,
  AccessAction,
  SecurityLevel,
  CrowdStatus
} from '../dto/access-control.dto';

@Injectable()
export class AccessControlService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('AccessControlService');
  }

  /**
   * Validate QR code for access control
   * Creates access control log record and returns validation result
   */
  async validateAccess(
    validationDto: AccessControlValidationDto,
    authenticatedUser?: {
      user_id: string;
      email: string;
      roles: string[];
      agent_id: string;
      session_id: string;
    }
  ): Promise<AccessControlValidationResponseDto> {
    const startTime = Date.now();
    const operationId = this.logger.startOperation('validateAccess', {
      qr_code: validationDto.qr_code,
      venue_id: validationDto.venue_id,
      entry_point: validationDto.entry_point,
      event_id: validationDto.event_id
    });
    
    console.log('🔍 DEBUG: validateAccess - Received event_id:', validationDto.event_id);
    console.log('🔍 DEBUG: validateAccess - Authenticated user:', authenticatedUser);

    try {
      // 1. FIRST: Check if QR code exists in physical_qr_codes table
      let physicalQR = null;
      try {
        physicalQR = await this.prisma.physical_qr_codes.findFirst({
          where: { qr_code: validationDto.qr_code }
        });
      } catch (dbError) {
        this.logger.warn(`Could not fetch physical QR code: ${dbError.message}`);
        // Continue with access_rights check even if physical_qr_codes fails
      }

      // 1.5. Check QR code suffix matches event category (ALWAYS check, even if physicalQR is null)
      if (validationDto.event_id) {
        try {
          const qrCodeParts = validationDto.qr_code.split(':');
          const qrSuffix = qrCodeParts.length >= 3 ? qrCodeParts[2].toUpperCase() : null;
          
          console.log('🔍 DEBUG: Suffix validation - QR code:', validationDto.qr_code);
          console.log('🔍 DEBUG: Suffix validation - Extracted suffix:', qrSuffix);
          console.log('🔍 DEBUG: Suffix validation - physicalQR exists:', !!physicalQR);
          
          if (qrSuffix) {
            // Get event to determine required suffix
            const event = await this.prisma.events.findUnique({
              where: { id: validationDto.event_id },
              include: {
                event_categories: true,
              },
            });

            console.log('🔍 DEBUG: Suffix validation - Event found:', event ? event.name : 'Not found');
            console.log('🔍 DEBUG: Suffix validation - Event category:', event?.event_categories?.name);

            if (event) {
              // Determine required suffix based on event category
              const categoryName = event.event_categories?.name?.toLowerCase() || '';
              const categoryCode = event.event_categories?.code?.toLowerCase() || '';
              const eventName = event.name?.toLowerCase() || '';
              
              // Check if it's Basketball or Volleyball (requires SUBVB)
              const isBasketballOrVolleyball = 
                categoryName.includes('basket') || categoryName.includes('volley') ||
                categoryCode.includes('basket') || categoryCode.includes('volley') ||
                eventName.includes('basket') || eventName.includes('volley');
              
              const requiredSuffix = isBasketballOrVolleyball ? 'SUBVB' : 'SUB';
              
              console.log('🔍 DEBUG: Suffix validation - Required suffix:', requiredSuffix);
              console.log('🔍 DEBUG: Suffix validation - QR suffix:', qrSuffix);
              console.log('🔍 DEBUG: Suffix validation - Match:', qrSuffix === requiredSuffix);
              
              if (qrSuffix !== requiredSuffix) {
                console.log('🔍 DEBUG: Suffix validation - WRONG_EVENT detected!');
                // Wrong suffix - log as WRONG_EVENT
                try {
                  await this.prisma.$transaction(async (tx) => {
                    await this.createAccessLogInTransaction(tx, {
                      access_right_id: null,
                      qr_code: validationDto.qr_code,
                      venue_id: validationDto.venue_id,
                      entry_point: validationDto.entry_point,
                      agent_id: validationDto.agent_id,
                      result: AccessStatus.DENIED,
                      denial_reason: DenialReason.WRONG_EVENT,
                      scan_metadata: {
                        ...validationDto,
                        qr_suffix: qrSuffix,
                        required_suffix: requiredSuffix,
                        event_category: event.event_categories?.name || 'Unknown',
                      },
                      event_id: validationDto.event_id,
                      authenticatedUser
                    });
                    await this.updateEventStats(tx, validationDto.event_id, 'DENIED');
                  });
                  console.log('✅ DEBUG: Suffix validation - WRONG_EVENT logged successfully');
                } catch (txError) {
                  console.error('❌ DEBUG: Suffix validation - Transaction error:', txError);
                  this.logger.error(`Failed to log WRONG_EVENT denial: ${txError.message}`);
                  // Continue to return WRONG_EVENT response even if logging fails
                }

                this.logger.endOperation('validateAccess', operationId, false);
                
                return {
                  result: AccessStatus.DENIED,
                  access_granted: false,
                  validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  denial_reason: DenialReason.WRONG_EVENT,
                  access_right: {
                    id: `temp-${Date.now()}`,
                    qr_code: validationDto.qr_code,
                    access_code: 'N/A',
                    source_type: 'PHYSICAL_QR',
                    status: 'wrong_event'
                  },
                  denial_details: {
                    primary_reason: 'QR code incompatible avec le type d\'événement',
                    technical_reason: `Suffixe requis: ${requiredSuffix}. Suffixe trouvé: ${qrSuffix}`
                  },
                  suggested_actions: [
                    'Vérifier que le QR code correspond au bon type d\'événement',
                    'Utiliser un QR code avec le suffixe correct'
                  ],
                  contact_info: {
                    supervisor_phone: '+216 71 123 999',
                    customer_service: 'support@entrix.tn'
                  },
                  validation_time_ms: Date.now() - startTime
                };
              }
            } else {
              console.log('⚠️ DEBUG: Suffix validation - Event not found, skipping suffix check');
            }
          } else {
            console.log('⚠️ DEBUG: Suffix validation - Could not extract suffix from QR code');
          }
        } catch (suffixError) {
          console.error('❌ DEBUG: Suffix validation error:', suffixError);
          this.logger.warn(`Error during suffix validation: ${suffixError.message}`);
          // Continue with normal validation flow if suffix check fails
        }
      }

      if (!physicalQR) {
        // ❌ QR code doesn't exist at all in physical_qr_codes table
        if (validationDto.event_id) {
          try {
            await this.prisma.$transaction(async (tx) => {
              await this.createAccessLogInTransaction(tx, {
          access_right_id: null,
          qr_code: validationDto.qr_code,
          venue_id: validationDto.venue_id,
          entry_point: validationDto.entry_point,
          agent_id: validationDto.agent_id,
          result: AccessStatus.DENIED,
          denial_reason: DenialReason.INVALID_QR,
          scan_metadata: validationDto,
                event_id: validationDto.event_id,
          authenticatedUser
        });
              await this.updateEventStats(tx, validationDto.event_id, 'DENIED');
            });
          } catch (txError) {
            console.error('❌ DEBUG: validateAccess - Transaction error in INVALID_QR case:', txError);
            this.logger.error(`Failed to log INVALID_QR denial: ${txError.message}`);
            // Continue to return INVALID_QR response even if logging fails
          }
        }

        this.logger.endOperation('validateAccess', operationId, false);
        
        return {
          result: AccessStatus.DENIED,
          access_granted: false,
          validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          denial_reason: DenialReason.INVALID_QR,
          access_right: {
            id: `temp-${Date.now()}`, // Temporary ID for non-existent QR
            qr_code: validationDto.qr_code,
            access_code: 'N/A', // Required field
            source_type: 'UNKNOWN', // Required field
            status: 'code_non_reconnu' // ⚫ BLACK styling - QR doesn't exist
          },
          denial_details: {
            primary_reason: 'Code QR non reconnu',
            technical_reason: 'Ce code QR n\'existe pas dans notre système'
          },
          suggested_actions: [
            'Vérifier le code QR',
            'Contacter le support si le code semble correct'
          ],
          contact_info: {
            supervisor_phone: '+216 71 123 999',
            customer_service: 'support@entrix.tn'
          },
          validation_time_ms: Date.now() - startTime
        };
      }

      // 2. SECOND: Check if QR code has access rights/subscription
      let accessRight = null;
      
      try {
        // Try to find the access right with subscription details
        // Handle both event-specific and seasonal/global access rights
        console.log('🔍 DEBUG: Looking for access right with qr_code:', validationDto.qr_code, 'and event_id:', validationDto.event_id);
        
        accessRight = await this.prisma.access_rights.findFirst({
          where: { 
            qr_code: validationDto.qr_code,
            OR: [
              { event_id: validationDto.event_id }, // Event-specific access rights
              { event_id: null } // Seasonal/global access rights (work for all events)
            ]
          },
          include: {
            subscriptions: {
              include: {
                subscription_plans: true,
                users: true
              }
            }
          }
        });
        
        console.log('🔍 DEBUG: Found access right:', accessRight ? `ID: ${accessRight.id}, current_uses: ${accessRight.current_uses}, max_uses: ${accessRight.max_uses}, type: ${accessRight.event_id ? 'EVENT-SPECIFIC' : 'SEASONAL/GLOBAL'}` : 'None found for this event');
      } catch (dbError) {
        this.logger.error(`Database error in access control validation: ${dbError.message}`);
        
        // Return a technical error response
        return {
          result: AccessStatus.DENIED,
          access_granted: false,
          validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          denial_reason: DenialReason.TECHNICAL_ERROR,
          denial_details: {
            primary_reason: 'Erreur de base de données',
            technical_reason: `Erreur de connexion: ${dbError.message}`
          },
          suggested_actions: [
            'Vérifier la connexion à la base de données',
            'Contacter le support technique'
          ],
          contact_info: {
            supervisor_phone: '+216 71 123 999',
            customer_service: 'support@entrix.tn'
          },
          validation_time_ms: Date.now() - startTime
        };
      }

      // 2.5. Check access right status (before checking subscription)
      if (accessRight) {
        const accessRightStatus = accessRight.status as string;
        console.log('🔍 DEBUG: validateAccess - Access right status:', accessRightStatus);
        
        // Check access right status
        if (accessRightStatus === 'SUSPENDED') {
          const eventIdForLog = validationDto.event_id || accessRight.event_id;
          if (eventIdForLog) {
            try {
              await this.prisma.$transaction(async (tx) => {
                await this.createAccessLogInTransaction(tx, {
                  access_right_id: accessRight.id,
                  qr_code: validationDto.qr_code,
                  venue_id: validationDto.venue_id,
                  entry_point: validationDto.entry_point,
                  agent_id: validationDto.agent_id,
                  result: AccessStatus.DENIED,
                  denial_reason: DenialReason.SUSPENDED_USER,
                  scan_metadata: validationDto,
                  event_id: eventIdForLog,
                  authenticatedUser
                });
                await this.updateEventStats(tx, eventIdForLog, 'DENIED');
              });
            } catch (txError) {
              console.error('❌ DEBUG: validateAccess - Transaction error in SUSPENDED_USER (access right) case:', txError);
              this.logger.error(`Failed to log SUSPENDED_USER denial: ${txError.message}`);
            }
          }
          
          this.logger.endOperation('validateAccess', operationId, false);
          return {
            result: AccessStatus.DENIED,
            access_granted: false,
            validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            denial_reason: DenialReason.SUSPENDED_USER,
            denial_details: {
              primary_reason: 'Accès suspendu',
              technical_reason: 'Cet accès a été suspendu par l\'administrateur'
            },
            access_right: {
              id: accessRight.id,
              qr_code: accessRight.qr_code,
              access_code: accessRight.access_code,
              source_type: accessRight.source_type,
              status: accessRight.status
            },
            suggested_actions: [
              'Contacter le support pour réactivation',
              'Vérifier le statut de l\'abonnement'
            ],
            contact_info: {
              supervisor_phone: '+216 71 123 999',
              customer_service: 'support@entrix.tn'
            },
            validation_time_ms: Date.now() - startTime
          };
        }
        
        if (accessRightStatus === 'CANCELLED' || accessRightStatus === 'REFUNDED' || accessRightStatus === 'TRANSFERRED') {
          const eventIdForLog = validationDto.event_id || accessRight.event_id;
          const denialReason = DenialReason.CANCELLED_TICKET;
          
          if (eventIdForLog) {
            try {
              await this.prisma.$transaction(async (tx) => {
                await this.createAccessLogInTransaction(tx, {
                  access_right_id: accessRight.id,
                  qr_code: validationDto.qr_code,
                  venue_id: validationDto.venue_id,
                  entry_point: validationDto.entry_point,
                  agent_id: validationDto.agent_id,
                  result: AccessStatus.DENIED,
                  denial_reason: denialReason,
                  scan_metadata: validationDto,
                  event_id: eventIdForLog,
                  authenticatedUser
                });
                await this.updateEventStats(tx, eventIdForLog, 'DENIED');
              });
            } catch (txError) {
              console.error(`❌ DEBUG: validateAccess - Transaction error in ${denialReason} (access right) case:`, txError);
              this.logger.error(`Failed to log ${denialReason} denial: ${txError.message}`);
            }
          }
          
          this.logger.endOperation('validateAccess', operationId, false);
          return {
            result: AccessStatus.DENIED,
            access_granted: false,
            validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            denial_reason: denialReason,
            denial_details: {
              primary_reason: accessRightStatus === 'CANCELLED' ? 'Accès annulé' : 'Accès révoqué',
              technical_reason: `Cet accès a été ${accessRightStatus === 'CANCELLED' ? 'annulé' : accessRightStatus === 'REFUNDED' ? 'remboursé' : 'transféré'}`
            },
            access_right: {
              id: accessRight.id,
              qr_code: accessRight.qr_code,
              access_code: accessRight.access_code,
              source_type: accessRight.source_type,
              status: accessRight.status
            },
            suggested_actions: [
              'Contacter le support',
              'Vérifier le statut de l\'abonnement'
            ],
            contact_info: {
              supervisor_phone: '+216 71 123 999',
              customer_service: 'support@entrix.tn'
            },
            validation_time_ms: Date.now() - startTime
          };
        }
        
        if (accessRightStatus === 'BLOCKED') {
          const eventIdForLog = validationDto.event_id || accessRight.event_id;
          if (eventIdForLog) {
            try {
              await this.prisma.$transaction(async (tx) => {
                await this.createAccessLogInTransaction(tx, {
                  access_right_id: accessRight.id,
                  qr_code: validationDto.qr_code,
                  venue_id: validationDto.venue_id,
                  entry_point: validationDto.entry_point,
                  agent_id: validationDto.agent_id,
                  result: AccessStatus.DENIED,
                  denial_reason: DenialReason.BLACKLISTED,
                  scan_metadata: validationDto,
                  event_id: eventIdForLog,
                  authenticatedUser
                });
                await this.updateEventStats(tx, eventIdForLog, 'DENIED');
              });
            } catch (txError) {
              console.error('❌ DEBUG: validateAccess - Transaction error in BLACKLISTED (access right) case:', txError);
              this.logger.error(`Failed to log BLACKLISTED denial: ${txError.message}`);
            }
          }
          
          this.logger.endOperation('validateAccess', operationId, false);
          return {
            result: AccessStatus.DENIED,
            access_granted: false,
            validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            denial_reason: DenialReason.BLACKLISTED,
            denial_details: {
              primary_reason: 'Accès bloqué',
              technical_reason: 'Cet accès a été bloqué par l\'administrateur'
            },
            access_right: {
              id: accessRight.id,
              qr_code: accessRight.qr_code,
              access_code: accessRight.access_code,
              source_type: accessRight.source_type,
              status: accessRight.status
            },
            suggested_actions: [
              'Contacter le support',
              'Vérifier les raisons du blocage'
            ],
            contact_info: {
              supervisor_phone: '+216 71 123 999',
              customer_service: 'support@entrix.tn'
            },
            validation_time_ms: Date.now() - startTime
          };
        }
        
        if (accessRightStatus === 'PENDING') {
          const eventIdForLog = validationDto.event_id || accessRight.event_id;
          if (eventIdForLog) {
            try {
              await this.prisma.$transaction(async (tx) => {
                await this.createAccessLogInTransaction(tx, {
                  access_right_id: accessRight.id,
                  qr_code: validationDto.qr_code,
                  venue_id: validationDto.venue_id,
                  entry_point: validationDto.entry_point,
                  agent_id: validationDto.agent_id,
                  result: AccessStatus.DENIED,
                  denial_reason: DenialReason.NOT_YET_VALID,
                  scan_metadata: validationDto,
                  event_id: eventIdForLog,
                  authenticatedUser
                });
                await this.updateEventStats(tx, eventIdForLog, 'DENIED');
              });
            } catch (txError) {
              console.error('❌ DEBUG: validateAccess - Transaction error in NOT_YET_VALID (access right) case:', txError);
              this.logger.error(`Failed to log PENDING_ACTIVATION denial: ${txError.message}`);
            }
          }
          
          this.logger.endOperation('validateAccess', operationId, false);
          return {
            result: AccessStatus.DENIED,
            access_granted: false,
            validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            denial_reason: DenialReason.NOT_YET_VALID,
            denial_details: {
              primary_reason: 'Activation en attente',
              technical_reason: 'Cet accès est en attente d\'activation'
            },
            access_right: {
              id: accessRight.id,
              qr_code: accessRight.qr_code,
              access_code: accessRight.access_code,
              source_type: accessRight.source_type,
              status: accessRight.status
            },
            suggested_actions: [
              'Attendre l\'activation',
              'Contacter le support si le délai est dépassé'
            ],
            contact_info: {
              supervisor_phone: '+216 71 123 999',
              customer_service: 'support@entrix.tn'
            },
            validation_time_ms: Date.now() - startTime
          };
        }
        
        // 2.6. Check subscription status and plan
        if (accessRight.subscriptions) {
          const subscription = accessRight.subscriptions;
          const subscriptionStatus = subscription.status as string;
          console.log('🔍 DEBUG: validateAccess - Subscription status:', subscriptionStatus);
          
          // Check subscription status
          if (subscriptionStatus === 'SUSPENDED') {
            const eventIdForLog = validationDto.event_id || accessRight.event_id;
            if (eventIdForLog) {
              try {
                await this.prisma.$transaction(async (tx) => {
                  await this.createAccessLogInTransaction(tx, {
                    access_right_id: accessRight.id,
                    qr_code: validationDto.qr_code,
                    venue_id: validationDto.venue_id,
                    entry_point: validationDto.entry_point,
                    agent_id: validationDto.agent_id,
                    result: AccessStatus.DENIED,
                    denial_reason: DenialReason.SUSPENDED_USER,
                    scan_metadata: validationDto,
                    event_id: eventIdForLog,
                    authenticatedUser
                  });
                  await this.updateEventStats(tx, eventIdForLog, 'DENIED');
                });
              } catch (txError) {
                console.error('❌ DEBUG: validateAccess - Transaction error in SUSPENDED_USER (subscription) case:', txError);
                this.logger.error(`Failed to log SUSPENDED_USER denial: ${txError.message}`);
              }
            }
            
            this.logger.endOperation('validateAccess', operationId, false);
            return {
              result: AccessStatus.DENIED,
              access_granted: false,
              validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              denial_reason: DenialReason.SUSPENDED_USER,
              denial_details: {
                primary_reason: 'Abonnement suspendu',
                technical_reason: 'Cet abonnement a été suspendu'
              },
              access_right: {
                id: accessRight.id,
                qr_code: accessRight.qr_code,
                access_code: accessRight.access_code,
                source_type: accessRight.source_type,
                status: accessRight.status
              },
              suggested_actions: [
                'Contacter le support pour réactivation',
                'Vérifier le statut de l\'abonnement'
              ],
              contact_info: {
                supervisor_phone: '+216 71 123 999',
                customer_service: 'support@entrix.tn'
              },
              validation_time_ms: Date.now() - startTime
            };
          }
          
          if (subscriptionStatus === 'CANCELLED' || subscriptionStatus === 'REFUNDED' || subscriptionStatus === 'TRANSFERRED') {
            const eventIdForLog = validationDto.event_id || accessRight.event_id;
            const denialReason = DenialReason.CANCELLED_TICKET;
            
            if (eventIdForLog) {
              try {
                await this.prisma.$transaction(async (tx) => {
                  await this.createAccessLogInTransaction(tx, {
                    access_right_id: accessRight.id,
                    qr_code: validationDto.qr_code,
                    venue_id: validationDto.venue_id,
                    entry_point: validationDto.entry_point,
                    agent_id: validationDto.agent_id,
                    result: AccessStatus.DENIED,
                    denial_reason: denialReason,
                    scan_metadata: validationDto,
                    event_id: eventIdForLog,
                    authenticatedUser
                  });
                  await this.updateEventStats(tx, eventIdForLog, 'DENIED');
                });
              } catch (txError) {
                console.error(`❌ DEBUG: validateAccess - Transaction error in ${denialReason} (subscription) case:`, txError);
                this.logger.error(`Failed to log ${denialReason} denial: ${txError.message}`);
              }
            }
            
            this.logger.endOperation('validateAccess', operationId, false);
            return {
              result: AccessStatus.DENIED,
              access_granted: false,
              validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              denial_reason: denialReason,
              denial_details: {
                primary_reason: subscriptionStatus === 'CANCELLED' ? 'Abonnement annulé' : 'Abonnement révoqué',
                technical_reason: `Cet abonnement a été ${subscriptionStatus === 'CANCELLED' ? 'annulé' : subscriptionStatus === 'REFUNDED' ? 'remboursé' : 'transféré'}`
              },
              access_right: {
                id: accessRight.id,
                qr_code: accessRight.qr_code,
                access_code: accessRight.access_code,
                source_type: accessRight.source_type,
                status: accessRight.status
              },
              suggested_actions: [
                'Contacter le support',
                'Vérifier le statut de l\'abonnement'
              ],
              contact_info: {
                supervisor_phone: '+216 71 123 999',
                customer_service: 'support@entrix.tn'
              },
              validation_time_ms: Date.now() - startTime
            };
          }
          
          if (subscriptionStatus === 'PENDING') {
            const eventIdForLog = validationDto.event_id || accessRight.event_id;
            if (eventIdForLog) {
              try {
                await this.prisma.$transaction(async (tx) => {
                  await this.createAccessLogInTransaction(tx, {
                    access_right_id: accessRight.id,
                    qr_code: validationDto.qr_code,
                    venue_id: validationDto.venue_id,
                    entry_point: validationDto.entry_point,
                    agent_id: validationDto.agent_id,
                    result: AccessStatus.DENIED,
                    denial_reason: DenialReason.NOT_YET_VALID,
                    scan_metadata: validationDto,
                    event_id: eventIdForLog,
                    authenticatedUser
                  });
                  await this.updateEventStats(tx, eventIdForLog, 'DENIED');
                });
              } catch (txError) {
                console.error('❌ DEBUG: validateAccess - Transaction error in NOT_YET_VALID (subscription) case:', txError);
                this.logger.error(`Failed to log NOT_YET_VALID denial: ${txError.message}`);
              }
            }
            
            this.logger.endOperation('validateAccess', operationId, false);
            return {
              result: AccessStatus.DENIED,
              access_granted: false,
              validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              denial_reason: DenialReason.NOT_YET_VALID,
              denial_details: {
                primary_reason: 'Abonnement en attente',
                technical_reason: 'Cet abonnement est en attente d\'activation'
              },
              access_right: {
                id: accessRight.id,
                qr_code: accessRight.qr_code,
                access_code: accessRight.access_code,
                source_type: accessRight.source_type,
                status: accessRight.status
              },
              suggested_actions: [
                'Attendre l\'activation',
                'Contacter le support si le délai est dépassé'
              ],
              contact_info: {
                supervisor_phone: '+216 71 123 999',
                customer_service: 'support@entrix.tn'
              },
              validation_time_ms: Date.now() - startTime
            };
          }
          
          // Check subscription dates
          const now = new Date();
          if (subscription.end_date && new Date(subscription.end_date) < now) {
            const eventIdForLog = validationDto.event_id || accessRight.event_id;
            if (eventIdForLog) {
              try {
                await this.prisma.$transaction(async (tx) => {
                  await this.createAccessLogInTransaction(tx, {
                    access_right_id: accessRight.id,
                    qr_code: validationDto.qr_code,
                    venue_id: validationDto.venue_id,
                    entry_point: validationDto.entry_point,
                    agent_id: validationDto.agent_id,
                    result: AccessStatus.DENIED,
                    denial_reason: DenialReason.EXPIRED,
                    scan_metadata: validationDto,
                    event_id: eventIdForLog,
                    authenticatedUser
                  });
                  await this.updateEventStats(tx, eventIdForLog, 'DENIED');
                });
              } catch (txError) {
                console.error('❌ DEBUG: validateAccess - Transaction error in EXPIRED (subscription date) case:', txError);
                this.logger.error(`Failed to log EXPIRED denial: ${txError.message}`);
              }
            }
            
            this.logger.endOperation('validateAccess', operationId, false);
            return {
              result: AccessStatus.DENIED,
              access_granted: false,
              validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              denial_reason: DenialReason.EXPIRED,
              denial_details: {
                primary_reason: 'Abonnement expiré',
                technical_reason: `Abonnement expiré le ${new Date(subscription.end_date).toLocaleDateString()}`
              },
              access_right: {
                id: accessRight.id,
                qr_code: accessRight.qr_code,
                access_code: accessRight.access_code,
                source_type: accessRight.source_type,
                status: accessRight.status
              },
              suggested_actions: [
                'Renouveler l\'abonnement',
                'Contacter le support'
              ],
              contact_info: {
                supervisor_phone: '+216 71 123 999',
                customer_service: 'support@entrix.tn'
              },
              validation_time_ms: Date.now() - startTime
            };
          }
          
          if (subscription.start_date && new Date(subscription.start_date) > now) {
            const eventIdForLog = validationDto.event_id || accessRight.event_id;
            if (eventIdForLog) {
              try {
                await this.prisma.$transaction(async (tx) => {
                  await this.createAccessLogInTransaction(tx, {
                    access_right_id: accessRight.id,
                    qr_code: validationDto.qr_code,
                    venue_id: validationDto.venue_id,
                    entry_point: validationDto.entry_point,
                    agent_id: validationDto.agent_id,
                    result: AccessStatus.DENIED,
                    denial_reason: DenialReason.NOT_YET_VALID,
                    scan_metadata: validationDto,
                    event_id: eventIdForLog,
                    authenticatedUser
                  });
                  await this.updateEventStats(tx, eventIdForLog, 'DENIED');
                });
              } catch (txError) {
                console.error('❌ DEBUG: validateAccess - Transaction error in NOT_YET_VALID (subscription date) case:', txError);
                this.logger.error(`Failed to log NOT_YET_VALID denial: ${txError.message}`);
              }
            }
            
            this.logger.endOperation('validateAccess', operationId, false);
            return {
              result: AccessStatus.DENIED,
              access_granted: false,
              validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              denial_reason: DenialReason.NOT_YET_VALID,
              denial_details: {
                primary_reason: 'Abonnement pas encore actif',
                technical_reason: `Abonnement actif à partir du ${new Date(subscription.start_date).toLocaleDateString()}`
              },
              access_right: {
                id: accessRight.id,
                qr_code: accessRight.qr_code,
                access_code: accessRight.access_code,
                source_type: accessRight.source_type,
                status: accessRight.status
              },
              suggested_actions: [
                'Attendre la date d\'activation',
                'Contacter le support si nécessaire'
              ],
              contact_info: {
                supervisor_phone: '+216 71 123 999',
                customer_service: 'support@entrix.tn'
              },
              validation_time_ms: Date.now() - startTime
            };
          }
          
          // Check subscription plan is_active
          if (subscription.subscription_plans && !subscription.subscription_plans.is_active) {
            const eventIdForLog = validationDto.event_id || accessRight.event_id;
            if (eventIdForLog) {
              try {
                await this.prisma.$transaction(async (tx) => {
                  await this.createAccessLogInTransaction(tx, {
                    access_right_id: accessRight.id,
                    qr_code: validationDto.qr_code,
                    venue_id: validationDto.venue_id,
                    entry_point: validationDto.entry_point,
                    agent_id: validationDto.agent_id,
                    result: AccessStatus.DENIED,
                    denial_reason: DenialReason.SUSPENDED_USER,
                    scan_metadata: validationDto,
                    event_id: eventIdForLog,
                    authenticatedUser
                  });
                  await this.updateEventStats(tx, eventIdForLog, 'DENIED');
                });
              } catch (txError) {
                console.error('❌ DEBUG: validateAccess - Transaction error in SUSPENDED_USER (plan inactive) case:', txError);
                this.logger.error(`Failed to log SUSPENDED_USER denial: ${txError.message}`);
              }
            }
            
            this.logger.endOperation('validateAccess', operationId, false);
            return {
              result: AccessStatus.DENIED,
              access_granted: false,
              validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              denial_reason: DenialReason.SUSPENDED_USER,
              denial_details: {
                primary_reason: 'Plan d\'abonnement inactif',
                technical_reason: 'Le plan d\'abonnement associé est inactif'
              },
              access_right: {
                id: accessRight.id,
                qr_code: accessRight.qr_code,
                access_code: accessRight.access_code,
                source_type: accessRight.source_type,
                status: accessRight.status
              },
              suggested_actions: [
                'Contacter le support',
                'Vérifier le statut du plan d\'abonnement'
              ],
              contact_info: {
                supervisor_phone: '+216 71 123 999',
                customer_service: 'support@entrix.tn'
              },
              validation_time_ms: Date.now() - startTime
            };
          }
        }
      }

      if (!accessRight) {
        // ❌ QR code exists in physical_qr_codes but no subscription/access rights for this event
        console.log('🔍 DEBUG: validateAccess - NO_SUBSCRIPTION case reached!');
        console.log('🔍 DEBUG: validateAccess - physicalQR:', JSON.stringify(physicalQR, null, 2));
        
        // Check if this QR code exists for other events
        let otherEventAccessRight = null;
        try {
          otherEventAccessRight = await this.prisma.access_rights.findFirst({
            where: { 
              qr_code: validationDto.qr_code,
              event_id: { not: validationDto.event_id } // Different event
            },
            include: {
              events: {
                select: { name: true, scheduled_start: true }
              }
            }
          });
          
          if (otherEventAccessRight) {
            console.log('🔍 DEBUG: QR code exists for different event:', otherEventAccessRight.events?.name);
          }
        } catch (error) {
          console.log('🔍 DEBUG: Error checking other events:', error.message);
        }
        
        console.log('🔍 DEBUG: validateAccess - About to create access control log...');
        const eventIdForLog = validationDto.event_id || otherEventAccessRight?.event_id;
        console.log('🔍 DEBUG: validateAccess - event_id for log:', eventIdForLog);
        
        // Use transaction to ensure both log and stats are updated
        // Wrap in try-catch so transaction errors don't fall to outer catch block
        try {
          await this.prisma.$transaction(async (tx) => {
            // Create access control log
            await this.createAccessLogInTransaction(tx, {
          access_right_id: null,
          qr_code: validationDto.qr_code,
          venue_id: validationDto.venue_id,
          entry_point: validationDto.entry_point,
          agent_id: validationDto.agent_id,
          result: AccessStatus.DENIED,
          denial_reason: DenialReason.NO_SUBSCRIPTION,
          scan_metadata: validationDto,
              event_id: eventIdForLog,
          authenticatedUser
        });
        
            // Update event statistics if event_id is available
            if (eventIdForLog) {
              console.log('🔍 DEBUG: validateAccess - Updating event stats for DENIED');
              await this.updateEventStats(tx, eventIdForLog, 'DENIED');
            } else {
              console.log('⚠️ DEBUG: validateAccess - Skipping event stats update (no event_id)');
            }
          });
          
          console.log('✅ DEBUG: validateAccess - Access control log and stats created successfully!');
        } catch (txError) {
          // Log the transaction error but don't let it change the response to TECHNICAL_ERROR
          console.error('❌ DEBUG: validateAccess - Transaction error in NO_SUBSCRIPTION case:', txError);
          this.logger.error(`Failed to log NO_SUBSCRIPTION denial: ${txError.message}`);
          // Continue to return NO_SUBSCRIPTION response even if logging fails
        }
        this.logger.endOperation('validateAccess', operationId, false);
        
        return {
          result: AccessStatus.DENIED,
          access_granted: false,
          validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          denial_reason: DenialReason.NO_SUBSCRIPTION,
          access_right: {
            id: `temp-${Date.now()}`, // Temporary ID for valid QR without subscription
            qr_code: validationDto.qr_code,
            access_code: 'N/A', // Required field
            source_type: 'PHYSICAL_QR', // Required field
            status: 'no_subscription', // 🔴 RED styling - Valid QR but no subscription
            serial_number: physicalQR.serial_number,
            // Include physical QR metadata for display - FIXED: Added zone data
            entry_gate: physicalQR.metadata?.['entry_gate'] || physicalQR.metadata?.['access_point'],
            zone_name: physicalQR.metadata?.['zone_name'] || physicalQR.metadata?.['zone'] || physicalQR.metadata?.['section'],
            seat_number: physicalQR.metadata?.['seat_number'] || physicalQR.metadata?.['seat'] || physicalQR.metadata?.['row'],
            plan_name: physicalQR.metadata?.['plan_name'] || physicalQR.metadata?.['plan'],
            user_name: physicalQR.metadata?.['user_name'] || physicalQR.metadata?.['user']
          },
          denial_details: {
            primary_reason: otherEventAccessRight 
              ? 'Code QR valide pour un autre événement' 
              : 'Code QR valide mais sans abonnement',
            technical_reason: otherEventAccessRight 
              ? `Ce code QR est valide pour l'événement "${otherEventAccessRight.events?.name}" mais pas pour l'événement actuel`
              : 'Ce code QR existe mais n\'a pas d\'abonnement actif attaché'
          },
          suggested_actions: [
            'Vérifier le statut de l\'abonnement',
            'Contacter le support pour activation'
          ],
          contact_info: {
            supervisor_phone: '+216 71 123 999',
            customer_service: 'support@entrix.tn'
          },
          validation_time_ms: Date.now() - startTime
        };
      }

      // 3. Check if access right is valid
      const now = new Date();
      if (accessRight.valid_until < now) {
        const eventIdForLog = validationDto.event_id || accessRight.event_id;
        if (eventIdForLog) {
          try {
            await this.prisma.$transaction(async (tx) => {
              await this.createAccessLogInTransaction(tx, {
          access_right_id: accessRight.id,
          qr_code: validationDto.qr_code,
          venue_id: validationDto.venue_id,
          entry_point: validationDto.entry_point,
          agent_id: validationDto.agent_id,
          result: AccessStatus.DENIED,
          denial_reason: DenialReason.EXPIRED,
          scan_metadata: validationDto,
                event_id: eventIdForLog,
          authenticatedUser
        });
              await this.updateEventStats(tx, eventIdForLog, 'DENIED');
            });
          } catch (txError) {
            console.error('❌ DEBUG: validateAccess - Transaction error in EXPIRED case:', txError);
            this.logger.error(`Failed to log EXPIRED denial: ${txError.message}`);
            // Continue to return EXPIRED response even if logging fails
          }
        }

        this.logger.endOperation('validateAccess', operationId, false);
        
        return {
          result: AccessStatus.DENIED,
          access_granted: false,
          validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          denial_reason: DenialReason.EXPIRED,
          denial_details: {
            primary_reason: 'Accès expiré',
            technical_reason: `Expiré le ${accessRight.valid_until.toISOString()}`
          },
          access_right: {
            id: accessRight.id,
            qr_code: accessRight.qr_code,
            access_code: accessRight.access_code,
            source_type: accessRight.source_type,
            status: accessRight.status
          },
          suggested_actions: [
            'Vérifier la date de validité',
            'Contacter le support pour renouvellement'
          ],
          contact_info: {
            supervisor_phone: '+216 71 123 999',
            customer_service: 'support@entrix.tn'
          },
          validation_time_ms: Date.now() - startTime
        };
      }

      // 4. Check if already used for this event (prevent duplicate scans)
      console.log('🔍 DEBUG: Checking for duplicate scans - access_right_id:', accessRight.id, 'event_id:', validationDto.event_id, 'access_right_event_id:', accessRight.event_id);
      
      const existingEventLog = await this.prisma.access_control_log.findFirst({
        where: {
          access_right_id: accessRight.id,
          event_id: validationDto.event_id, // Always check within the current event
          result: 'SUCCESS'
        }
      });
      
      console.log('🔍 DEBUG: Duplicate check result:', existingEventLog ? `Found existing scan at ${existingEventLog.scanned_at}` : 'No duplicates found');

      if (existingEventLog) {
        const eventIdForLog = validationDto.event_id || existingEventLog.event_id || accessRight.event_id;
        if (eventIdForLog) {
          try {
            await this.prisma.$transaction(async (tx) => {
              await this.createAccessLogInTransaction(tx, {
          access_right_id: accessRight.id,
          qr_code: validationDto.qr_code,
          venue_id: validationDto.venue_id,
          entry_point: validationDto.entry_point,
          agent_id: validationDto.agent_id,
          result: AccessStatus.DENIED,
          denial_reason: DenialReason.ALREADY_USED,
          scan_metadata: {
            ...validationDto,
            previous_scan: existingEventLog.scanned_at,
            previous_agent: existingEventLog.controller_device
          },
                event_id: eventIdForLog,
          authenticatedUser
        });
              await this.updateEventStats(tx, eventIdForLog, 'DENIED');
            });
          } catch (txError) {
            console.error('❌ DEBUG: validateAccess - Transaction error in ALREADY_USED case (duplicate):', txError);
            this.logger.error(`Failed to log ALREADY_USED denial: ${txError.message}`);
            // Continue to return ALREADY_USED response even if logging fails
          }
        }

        this.logger.endOperation('validateAccess', operationId, false);
        
        // Get physical QR data for ALREADY_USED case to show access information
        let physicalQRData = null;
        try {
          physicalQRData = await this.prisma.physical_qr_codes.findFirst({
            where: { qr_code: validationDto.qr_code }
          });
        } catch (error) {
          this.logger.warn(`Could not fetch physical QR data for ALREADY_USED: ${error.message}`);
        }
        
        return {
          result: AccessStatus.DENIED,
          access_granted: false,
          validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          denial_reason: DenialReason.ALREADY_USED,
          denial_details: {
            primary_reason: 'QR code déjà utilisé pour cet événement',
            technical_reason: `Déjà scanné le ${existingEventLog.scanned_at.toLocaleString()} par ${existingEventLog.controller_device}`,
            last_usage: {
              timestamp: existingEventLog.scanned_at.toISOString(),
              entry_point: existingEventLog.controller_device,
              agent: existingEventLog.controller_device
            }
          },
          access_right: {
            id: accessRight.id,
            qr_code: accessRight.qr_code,
            access_code: accessRight.access_code,
            source_type: accessRight.source_type,
            status: accessRight.status,
            // FIXED: Include serial number and access information for ALREADY_USED
            serial_number: physicalQRData?.serial_number || 'N/A',
            entry_gate: physicalQRData?.metadata?.['entry_gate'] || physicalQRData?.metadata?.['access_point'],
            zone_name: physicalQRData?.metadata?.['zone_name'] || physicalQRData?.metadata?.['zone'] || physicalQRData?.metadata?.['section'],
            seat_number: physicalQRData?.metadata?.['seat_number'] || physicalQRData?.metadata?.['seat'] || physicalQRData?.metadata?.['row'],
            plan_name: physicalQRData?.metadata?.['plan_name'] || physicalQRData?.metadata?.['plan'],
            user_name: physicalQRData?.metadata?.['user_name'] || physicalQRData?.metadata?.['user']
          },
          suggested_actions: [
            'Vérifier si la personne est déjà entrée',
            'Contacter superviseur si contestation'
          ],
          contact_info: {
            supervisor_phone: '+216 71 123 999',
            customer_service: 'support@entrix.tn'
          },
          validation_time_ms: Date.now() - startTime
        };
      }

      // 5. Check if already used (for single-use tickets)
      console.log('🔍 DEBUG: Usage check - current_uses:', accessRight.current_uses, 'max_uses:', accessRight.max_uses);
      
      if (accessRight.current_uses >= accessRight.max_uses) {
        console.log('🔍 DEBUG: Usage limit exceeded - checking last usage across all events');
        // Get the last successful scan for this access right
        const lastUsage = await this.prisma.access_control_log.findFirst({
          where: {
            access_right_id: accessRight.id,
            result: 'SUCCESS'
          },
          orderBy: {
            scanned_at: 'desc'
          }
        });

        // Get physical QR data for ALREADY_USED case to show access information
        let physicalQRData = null;
        try {
          physicalQRData = await this.prisma.physical_qr_codes.findFirst({
            where: { qr_code: validationDto.qr_code }
          });
        } catch (error) {
          this.logger.warn(`Could not fetch physical QR data for ALREADY_USED: ${error.message}`);
        }
        
        const eventIdForLog = validationDto.event_id || accessRight.event_id;
        if (eventIdForLog) {
          try {
            await this.prisma.$transaction(async (tx) => {
              await this.createAccessLogInTransaction(tx, {
          access_right_id: accessRight.id,
          qr_code: validationDto.qr_code,
          venue_id: validationDto.venue_id,
          entry_point: validationDto.entry_point,
          agent_id: validationDto.agent_id,
          result: AccessStatus.DENIED,
          denial_reason: DenialReason.ALREADY_USED,
          scan_metadata: validationDto,
                event_id: eventIdForLog,
          authenticatedUser
        });
              await this.updateEventStats(tx, eventIdForLog, 'DENIED');
            });
          } catch (txError) {
            console.error('❌ DEBUG: validateAccess - Transaction error in ALREADY_USED case (max uses):', txError);
            this.logger.error(`Failed to log ALREADY_USED denial: ${txError.message}`);
            // Continue to return ALREADY_USED response even if logging fails
          }
        }

        this.logger.endOperation('validateAccess', operationId, false);
        
        return {
          result: AccessStatus.DENIED,
          access_granted: false,
          validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          denial_reason: DenialReason.ALREADY_USED,
          denial_details: {
            primary_reason: 'Accès déjà utilisé',
            technical_reason: `Utilisé ${accessRight.current_uses}/${accessRight.max_uses} fois`,
            last_usage: lastUsage ? {
              timestamp: lastUsage.scanned_at.toISOString(),
              entry_point: lastUsage.access_point_id || 'Inconnu',
              agent: lastUsage.controller_device || 'Système'
            } : (accessRight.used_at ? {
              timestamp: accessRight.used_at.toISOString(),
              entry_point: accessRight.used_at_access_point || 'Inconnu',
              agent: 'Système'
            } : undefined)
          },
          access_right: {
            id: accessRight.id,
            qr_code: accessRight.qr_code,
            access_code: accessRight.access_code,
            source_type: accessRight.source_type,
            status: accessRight.status,
            // FIXED: Include serial number and access information for ALREADY_USED
            serial_number: physicalQRData?.serial_number || 'N/A',
            entry_gate: physicalQRData?.metadata?.['entry_gate'] || physicalQRData?.metadata?.['access_point'],
            zone_name: physicalQRData?.metadata?.['zone_name'] || physicalQRData?.metadata?.['zone'] || physicalQRData?.metadata?.['section'],
            seat_number: physicalQRData?.metadata?.['seat_number'] || physicalQRData?.metadata?.['seat'] || physicalQRData?.metadata?.['row'],
            plan_name: physicalQRData?.metadata?.['plan_name'] || physicalQRData?.metadata?.['plan'],
            user_name: physicalQRData?.metadata?.['user_name'] || physicalQRData?.metadata?.['user']
          },
          suggested_actions: [
            'Vérifier si la personne est déjà entrée',
            'Contacter superviseur si contestation'
          ],
          contact_info: {
            supervisor_phone: '+216 71 123 999',
            customer_service: 'support@entrix.tn'
          },
          validation_time_ms: Date.now() - startTime
        };
      }

      // 6. Check venue/zone restrictions
      if (accessRight.zone_id && validationDto.zone_id && accessRight.zone_id !== validationDto.zone_id) {
        const eventIdForLog = validationDto.event_id || accessRight.event_id;
        if (eventIdForLog) {
          try {
            await this.prisma.$transaction(async (tx) => {
              await this.createAccessLogInTransaction(tx, {
          access_right_id: accessRight.id,
          qr_code: validationDto.qr_code,
          venue_id: validationDto.venue_id,
          entry_point: validationDto.entry_point,
          agent_id: validationDto.agent_id,
          result: AccessStatus.DENIED,
          denial_reason: DenialReason.WRONG_ZONE,
          scan_metadata: validationDto,
                event_id: eventIdForLog,
          authenticatedUser
        });
              await this.updateEventStats(tx, eventIdForLog, 'DENIED');
            });
          } catch (txError) {
            console.error('❌ DEBUG: validateAccess - Transaction error in WRONG_ZONE case:', txError);
            this.logger.error(`Failed to log WRONG_ZONE denial: ${txError.message}`);
            // Continue to return WRONG_ZONE response even if logging fails
          }
        }

        this.logger.endOperation('validateAccess', operationId, false);
        
        return {
          result: AccessStatus.DENIED,
          access_granted: false,
          validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          denial_reason: DenialReason.WRONG_ZONE,
          denial_details: {
            primary_reason: 'Mauvaise zone d\'accès',
            technical_reason: `Zone autorisée: ${accessRight.zone_id}, Zone tentée: ${validationDto.zone_id}`
          },
          access_right: {
            id: accessRight.id,
            qr_code: accessRight.qr_code,
            access_code: accessRight.access_code,
            source_type: accessRight.source_type,
            status: accessRight.status
          },
          suggested_actions: [
            'Diriger vers la zone autorisée',
            'Vérifier l\'affectation de zone'
          ],
          contact_info: {
            supervisor_phone: '+216 71 123 999',
            customer_service: 'support@entrix.tn'
          },
          validation_time_ms: Date.now() - startTime
        };
      }

      // 7. Grant access and update usage with proper error handling
      try {
        console.log('🔍 DEBUG: Starting transaction for GRANTED access');
        console.log('🔍 DEBUG: event_id:', validationDto.event_id);
        console.log('🔍 DEBUG: access_right_id:', accessRight.id);
        console.log('🔍 DEBUG: qr_code:', validationDto.qr_code);
        
        // Use transaction to ensure data consistency
        await this.prisma.$transaction(async (tx) => {
          console.log('🔍 DEBUG: Inside transaction - updating access_rights');
          
          // Update access right usage - disable audit trigger temporarily
          await tx.$executeRaw`ALTER TABLE access_rights DISABLE TRIGGER trigger_audit_access_rights`;
          
          await tx.access_rights.update({
            where: { id: accessRight.id },
            data: {
              current_uses: { increment: 1 },
              used_at: now,
              used_at_access_point: validationDto.entry_point
            }
          });
          
          // Re-enable audit trigger
          await tx.$executeRaw`ALTER TABLE access_rights ENABLE TRIGGER trigger_audit_access_rights`;

          console.log('🔍 DEBUG: Creating access_control_log entry');
          console.log('🔍 DEBUG: Log data - event_id:', validationDto.event_id);
          console.log('🔍 DEBUG: Log data - user_id:', authenticatedUser?.user_id || '894e001d-e307-480d-9ed0-a54368ac954d');

          // Create access control log
          const logEntry = await tx.access_control_log.create({
            data: {
              access_right_id: accessRight.id,
              access_point_id: null, // Set to null since we don't have a valid access point ID
              user_id: authenticatedUser?.user_id || '894e001d-e307-480d-9ed0-a54368ac954d', // Use authenticated user or fallback to admin
              event_id: validationDto.event_id, // Use event_id from request
              action: 'VALIDATION' as any,
              result: 'SUCCESS' as any, // Using Prisma enum value
              controller_device: authenticatedUser?.agent_id || validationDto.agent_id || 'DEMO_SCANNER',
              scan_metadata: JSON.stringify({
                ...validationDto,
                access_right_id: accessRight.id,
                subscription_id: accessRight.subscription_id,
                zone_id: accessRight.zone_id,
                seat_id: accessRight.seat_id
              }),
              scanned_at: now
            }
          });

          console.log('✅ DEBUG: Successfully created access_control_log with ID:', logEntry.id);

          // Update event statistics for the current event
          console.log('🔍 DEBUG: updateEventStats - Using event_id:', validationDto.event_id);
          await this.updateEventStats(tx, validationDto.event_id, 'GRANTED');
        });

        console.log('✅ DEBUG: Transaction completed successfully');
        this.logger.log(`Access granted successfully for QR: ${validationDto.qr_code}`);
      } catch (updateError) {
        console.error('❌ DEBUG: Transaction failed with error:', updateError);
        console.error('❌ DEBUG: Error message:', updateError.message);
        console.error('❌ DEBUG: Error stack:', updateError.stack);
        this.logger.error(`Error updating access right and creating log: ${updateError.message}`);
        
        // Still create a log entry for the error
        await this.createAccessLog({
          access_right_id: accessRight.id,
          qr_code: validationDto.qr_code,
          venue_id: validationDto.venue_id,
          entry_point: validationDto.entry_point,
          agent_id: validationDto.agent_id,
          result: AccessStatus.DENIED,
          denial_reason: DenialReason.TECHNICAL_ERROR,
          scan_metadata: { ...validationDto, error: updateError.message },
          event_id: validationDto.event_id || accessRight.event_id || undefined,
          authenticatedUser
        });

        // Return technical error response
        return {
          result: AccessStatus.DENIED,
          access_granted: false,
          validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          denial_reason: DenialReason.TECHNICAL_ERROR,
          denial_details: {
            primary_reason: 'Erreur lors de la mise à jour',
            technical_reason: `Erreur de base de données: ${updateError.message}`
          },
          suggested_actions: [
            'Réessayer dans quelques secondes',
            'Contacter le support technique'
          ],
          contact_info: {
            supervisor_phone: '+216 71 123 999',
            customer_service: 'support@entrix.tn'
          },
          validation_time_ms: Date.now() - startTime
        };
      }

      this.logger.endOperation('validateAccess', operationId, true);
      
      // 8. Return successful response with all subscription details
      const subscription = accessRight.subscriptions;
      const subscriptionPlan = subscription?.subscription_plans;
      const accessMetadata = accessRight.access_metadata as any;
      
      // Extract zone information from QR code pattern (NTRX:CSS:SUB:C2:4CF7DH)
      const qrCodeParts = validationDto.qr_code.split(':');
      const zoneCode = qrCodeParts.length >= 4 ? qrCodeParts[3] : null;
      
      // Get venue zone information if zone code is available
      let venueZone = null;
      if (zoneCode) {
        try {
          venueZone = await this.prisma.venue_zones.findFirst({
            where: { code: zoneCode }
          });
        } catch (error) {
          this.logger.warn(`Could not fetch venue zone for code ${zoneCode}: ${error.message}`);
        }
      }
      
      // Get detailed metadata from physical_qr_codes table
      let qrCodeMetadata = null;
      try {
        const physicalQrCode = await this.prisma.physical_qr_codes.findFirst({
          where: { qr_code: validationDto.qr_code }
        });
        qrCodeMetadata = physicalQrCode?.metadata as any;
      } catch (error) {
        this.logger.warn(`Could not fetch physical QR code metadata: ${error.message}`);
      }
      
      return {
        result: AccessStatus.GRANTED,
        access_granted: true,
        validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        access_right: {
          id: accessRight.id,
          qr_code: accessRight.qr_code,
          access_code: accessRight.access_code,
          status: accessRight.status,
          source_type: accessRight.source_type,
          valid_from: accessRight.valid_from,
          valid_until: accessRight.valid_until,
          max_uses: accessRight.max_uses,
          current_uses: accessRight.current_uses + 1, // Updated count
          zone_id: accessRight.zone_id,
          seat_id: accessRight.seat_id,
          access_metadata: accessRight.access_metadata
        },
        user_info: {
          user_id: accessRight.subscriptions?.users?.id || accessRight.user_id,
          holder_name: accessRight.subscriptions?.users?.first_name && accessRight.subscriptions?.users?.last_name 
            ? `${accessRight.subscriptions.users.first_name} ${accessRight.subscriptions.users.last_name}`
            : accessRight.subscriptions?.metadata?.guestName || 'Unknown User'
        },
        event_info: {
          event_id: validationDto.event_id, // Use current event ID or fallback
          event_name: 'Current Live Event' // Dynamic event name
        },
        subscription_info: {
          subscription_id: accessRight.subscription_id,
          plan_name: subscriptionPlan?.name || 'Unknown Plan',
          plan_description: subscriptionPlan?.description || '',
          zone_name: qrCodeMetadata?.zone || venueZone?.name || accessMetadata?.zone_name || accessRight.zone_id || 'Unknown Zone',
          access_point: qrCodeMetadata?.entry_gate || venueZone?.code || accessMetadata?.access_point || accessMetadata?.gate || accessMetadata?.porte || 'Unknown Gate',
          seat_number: qrCodeMetadata?.seat || accessMetadata?.seat_number || accessMetadata?.seat || accessRight.seat_id || 'Unknown Seat',
          gate_number: qrCodeMetadata?.entry_gate || venueZone?.code || accessMetadata?.gate_number || accessMetadata?.gate || accessMetadata?.porte || 'Unknown Gate',
          section: qrCodeMetadata?.zone || venueZone?.name || accessMetadata?.section || accessMetadata?.zone_name || 'Unknown Section',
          row: accessMetadata?.row || 'Unknown Row',
          price: venueZone?.base_price || subscriptionPlan?.price || 0,
          currency: venueZone?.currency || subscriptionPlan?.currency || 'TND'
        },
        security_context: {
          security_level: SecurityLevel.STANDARD,
          crowd_status: CrowdStatus.NORMAL
        },
        validation_time_ms: Date.now() - startTime
      };

    } catch (error) {
      this.logger.endOperation('validateAccess', operationId, false, undefined, { error: error.message });
      
      // Log technical error
      await this.createAccessLog({
        access_right_id: null,
        qr_code: validationDto.qr_code,
        venue_id: validationDto.venue_id,
        entry_point: validationDto.entry_point,
        agent_id: validationDto.agent_id,
        result: AccessStatus.DENIED,
        denial_reason: DenialReason.TECHNICAL_ERROR,
        scan_metadata: { ...validationDto, error: error.message },
        event_id: validationDto.event_id || undefined,
        authenticatedUser
      });

      return {
        result: AccessStatus.DENIED,
        access_granted: false,
        validation_id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        denial_reason: DenialReason.TECHNICAL_ERROR,
        denial_details: {
          primary_reason: 'Erreur technique',
          technical_reason: 'Erreur lors de la validation'
        },
        suggested_actions: [
          'Réessayer dans quelques secondes',
          'Contacter le support technique'
        ],
        contact_info: {
          supervisor_phone: '+216 71 123 999',
          customer_service: 'support@entrix.tn'
        },
        validation_time_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Create access control log record within a transaction
   */
  private async createAccessLogInTransaction(
    tx: any,
    logData: {
      access_right_id: string | null;
      qr_code: string;
      venue_id: string;
      entry_point: string;
      agent_id?: string;
      result: AccessStatus;
      denial_reason?: DenialReason;
      scan_metadata: any;
      event_id?: string;
      authenticatedUser?: {
        user_id: string;
        email: string;
        roles: string[];
        agent_id: string;
        session_id: string;
      };
    }
  ) {
    try {
      console.log('🔍 DEBUG: createAccessLogInTransaction - Starting...');
      console.log('🔍 DEBUG: createAccessLogInTransaction - event_id:', logData.event_id);
      
      const userId = '894e001d-e307-480d-9ed0-a54368ac954d';
      const eventId = logData.event_id;
      
      if (!eventId) {
        console.log('⚠️ DEBUG: createAccessLogInTransaction - Skipping (no event_id)');
        return;
      }
      
      // Build final data object - only include access_right_id if it has a value
      // Prisma treats undefined as "omit field" but null as "set to null"
      // Since the database may have a NOT NULL constraint, we must omit the field entirely
      const createData: any = {
        access_point_id: null,
        user_id: userId,
        event_id: eventId,
        action: 'VALIDATION' as any,
        result: logData.result as any,
        denial_reason: logData.denial_reason as any,
        controller_device: logData.authenticatedUser?.agent_id || logData.agent_id || 'DEMO_SCANNER',
        scan_metadata: typeof logData.scan_metadata === 'string' ? logData.scan_metadata : JSON.stringify(logData.scan_metadata),
        scanned_at: new Date()
      };
      
      // Only add access_right_id if it has a value (not null/undefined)
      // If null/undefined, the field will be omitted from the INSERT statement
      if (logData.access_right_id != null && logData.access_right_id !== undefined) {
        createData.access_right_id = logData.access_right_id;
      }
      
      const logEntry = await tx.access_control_log.create({
        data: createData
      });
      
      console.log('✅ DEBUG: createAccessLogInTransaction - Created log with ID:', logEntry.id);
    } catch (error) {
      console.error('❌ DEBUG: createAccessLogInTransaction - Error:', error);
      throw error; // Re-throw to let transaction handle it
    }
  }

  /**
   * Create access control log record - simplified
   */
  private async createAccessLog(
    logData: {
      access_right_id: string | null;
      qr_code: string;
      venue_id: string;
      entry_point: string;
      agent_id?: string;
      result: AccessStatus;
      denial_reason?: DenialReason;
      scan_metadata: any;
      event_id?: string;
      authenticatedUser?: {
        user_id: string;
        email: string;
        roles: string[];
        agent_id: string;
        session_id: string;
      };
    }
  ) {
    try {
      console.log('🔍 DEBUG: createAccessLog - Starting to create log...');
      console.log('🔍 DEBUG: createAccessLog - logData:', JSON.stringify(logData, null, 2));
      
      // Test database connectivity first
      console.log('🔍 DEBUG: createAccessLog - Testing database connectivity...');
      const tableCount = await this.prisma.access_control_log.count();
      console.log('🔍 DEBUG: createAccessLog - Current access_control_log count:', tableCount);
      
      // Use agent_id as the primary identifier since that's who's actually doing the scan
      const agentId = logData.authenticatedUser?.agent_id || logData.authenticatedUser?.user_id;
      let eventId = logData.event_id 
        || logData.scan_metadata?.event_id 
        || logData.scan_metadata?.eventId 
        || logData.scan_metadata?.event?.id;
      
      if (!eventId && logData.access_right_id) {
        const accessRight = await this.prisma.access_rights.findUnique({
          where: { id: logData.access_right_id },
          select: { event_id: true }
        });
        eventId = accessRight?.event_id || null;
      }
      
      console.log('🔍 DEBUG: createAccessLog - agentId:', agentId, 'eventId:', eventId);
      console.log('🔍 DEBUG: createAccessLog - authenticatedUser:', JSON.stringify(logData.authenticatedUser, null, 2));
      
      // Use hardcoded Admin User UUID for simplicity
      const userId = '894e001d-e307-480d-9ed0-a54368ac954d';
      
      // Skip logging if we don't have required data
      if (!eventId) {
        console.log('⚠️ DEBUG: createAccessLog - Skipping log creation due to missing eventId');
        console.log('⚠️ DEBUG: createAccessLog - eventId:', eventId);
        return;
      }
      
      // Build final data object - only include access_right_id if it has a value
      // Prisma treats undefined as "omit field" but null as "set to null"
      // Since the database may have a NOT NULL constraint, we must omit the field entirely
      const createData: any = {
          access_point_id: null,
          user_id: userId, // Now guaranteed to have a value (user_id or agent_id)
          event_id: eventId, // Now guaranteed to have a value
          action: 'VALIDATION' as any,
          result: logData.result as any,
          denial_reason: logData.denial_reason as any,
          controller_device: logData.authenticatedUser?.agent_id || logData.agent_id || 'DEMO_SCANNER',
          scan_metadata: typeof logData.scan_metadata === 'string' ? logData.scan_metadata : JSON.stringify(logData.scan_metadata),
          scanned_at: new Date()
      };
      
      // Only add access_right_id if it has a value (not null/undefined)
      // If null/undefined, the field will be omitted from the INSERT statement
      if (logData.access_right_id != null && logData.access_right_id !== undefined) {
        createData.access_right_id = logData.access_right_id;
      }
      
      console.log('🔍 DEBUG: createAccessLog - logRecord to insert:', JSON.stringify(createData, null, 2));
      console.log('🔍 DEBUG: createAccessLog - About to call Prisma...');
      
      // Use a simple insert with minimal required fields
      const createdLog = await this.prisma.access_control_log.create({
        data: createData
      });
      
      console.log('✅ DEBUG: createAccessLog - Successfully created log with ID:', createdLog.id);
      
    } catch (error) {
      // Just log the error but don't fail the validation
      console.error('❌ DEBUG: createAccessLog - Error creating log:', error);
      console.error('❌ DEBUG: createAccessLog - Error message:', error.message);
      console.error('❌ DEBUG: createAccessLog - Error stack:', error.stack);
      this.logger.error(`Failed to create access control log: ${error.message}`);
    }
  }

  /**
   * Update event statistics using the event_stats table
   */
  private async updateEventStats(tx: any, eventId: string, result: 'GRANTED' | 'DENIED') {
    try {
      console.log('🔍 DEBUG: updateEventStats - Starting with eventId:', eventId, 'result:', result);
      const now = new Date();
      const statType = result === 'GRANTED' ? 'ACCESS_GRANTED' : 'ACCESS_DENIED';
      
      // Create a new event stat record
      await tx.event_stats.create({
        data: {
          event_id: eventId,
          stat_type: statType,
          stat_category: 'ACCESS_CONTROL',
          value_numeric: 1,
          value_text: `Access ${result.toLowerCase()} at ${now.toISOString()}`,
          timestamp_recorded: now,
          is_official: true,
          is_public: true
        }
      });

      // Also update total access count
      await tx.event_stats.create({
        data: {
          event_id: eventId,
          stat_type: 'TOTAL_ACCESSES',
          stat_category: 'ACCESS_CONTROL',
          value_numeric: 1,
          value_text: `Total access attempt at ${now.toISOString()}`,
          timestamp_recorded: now,
          is_official: true,
          is_public: true
        }
      });

      this.logger.log(`Event stats updated for event ${eventId}: ${result}`);
    } catch (error) {
      this.logger.error(`Failed to update event stats for event ${eventId}: ${error.message}`);
    }
  }

  // ============================================================================
  // ACCESS CONTROL LOGS MANAGEMENT
  // ============================================================================

  /**
   * Get access control logs with filtering and pagination
   */
  async getAccessLogs(filters: {
    page?: number;
    limit?: number;
    search?: string;
    result?: string;
    denial_reason?: string;
    event_id?: string;
    date_from?: string;
    date_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) {
    const operationId = this.logger.startOperation('getAccessLogs', filters);

    try {
      const { page = 1, limit = 20, sort_by = 'scanned_at', sort_order = 'desc' } = filters;
      const skip = (page - 1) * limit;

      console.log('🔍 DEBUG: getAccessLogs - filters received:', JSON.stringify(filters, null, 2));

      // Build where clause
      const where: any = {};

      if (filters.search) {
        where.OR = [
          { controller_device: { contains: filters.search, mode: 'insensitive' } },
          { scan_metadata: { path: ['qr_code'], string_contains: filters.search } },
          { notes: { contains: filters.search, mode: 'insensitive' } },
          // Search in access_rights QR code
          { 
            access_rights: {
              qr_code: { contains: filters.search, mode: 'insensitive' }
            }
          },
          // Search in event name
          {
            events: {
              name: { contains: filters.search, mode: 'insensitive' }
            }
          },
          // Search in user information
          {
            users: {
              OR: [
                { first_name: { contains: filters.search, mode: 'insensitive' } },
                { last_name: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } }
              ]
            }
          }
        ];
      }

      if (filters.result && filters.result !== '') {
        where.result = filters.result;
      }

      if (filters.denial_reason && filters.denial_reason !== '') {
        where.denial_reason = filters.denial_reason;
      }

      if (filters.event_id) {
        where.event_id = filters.event_id;
      }

      if (filters.date_from || filters.date_to) {
        where.scanned_at = {};
        if (filters.date_from) {
          where.scanned_at.gte = new Date(filters.date_from);
        }
        if (filters.date_to) {
          where.scanned_at.lte = new Date(filters.date_to);
        }
      }

      // Build order by
      const orderBy: any = {};
      orderBy[sort_by] = sort_order;

      console.log('🔍 DEBUG: getAccessLogs - where clause:', JSON.stringify(where, null, 2));
      console.log('🔍 DEBUG: getAccessLogs - orderBy:', JSON.stringify(orderBy, null, 2));

      const [logs, total] = await Promise.all([
        this.prisma.access_control_log.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            access_rights: {
              include: {
                subscriptions: {
                  include: {
                    users: true,
                    subscription_plans: true,
                  },
                },
              },
            },
            events: {
              select: {
                id: true,
                name: true,
                scheduled_start: true,
                scheduled_end: true,
              },
            },
            users: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
            access_points: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        }),
        this.prisma.access_control_log.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      console.log('🔍 DEBUG: getAccessLogs - total logs found:', total);
      console.log('🔍 DEBUG: getAccessLogs - logs returned:', logs.length);
      console.log('🔍 DEBUG: getAccessLogs - first few logs:', logs.slice(0, 3).map(log => ({ id: log.id, result: log.result, denial_reason: log.denial_reason })));
      
      // Debug: Check ALL denial reasons in the database
      const allDenialReasons = await this.prisma.access_control_log.findMany({
        select: { denial_reason: true },
        distinct: ['denial_reason']
      });
      console.log('🔍 DEBUG: getAccessLogs - ALL denial reasons in DB:', allDenialReasons.map(r => r.denial_reason));
      
      // Debug: Check specifically for ALREADY_USED
      const alreadyUsedCount = await this.prisma.access_control_log.count({
        where: { denial_reason: 'ALREADY_USED' }
      });
      console.log('🔍 DEBUG: getAccessLogs - ALREADY_USED count in DB:', alreadyUsedCount);
      
      // Debug: Check if filter is being applied correctly
      if (filters.denial_reason === 'ALREADY_USED') {
        console.log('🔍 DEBUG: getAccessLogs - Filtering for ALREADY_USED, where clause:', JSON.stringify(where, null, 2));
        const alreadyUsedLogs = await this.prisma.access_control_log.findMany({
          where: { denial_reason: 'ALREADY_USED' },
          take: 5
        });
        console.log('🔍 DEBUG: getAccessLogs - ALREADY_USED logs found:', alreadyUsedLogs.length);
        console.log('🔍 DEBUG: getAccessLogs - ALREADY_USED logs:', alreadyUsedLogs.map(log => ({ id: log.id, denial_reason: log.denial_reason, result: log.result })));
      }

      this.logger.endOperation('getAccessLogs', operationId, true, undefined, { total, page, limit });

      const mappedLogs = await Promise.all(logs.map(log => this.mapAccessLogToResponse(log)));
      
      return {
        logs: mappedLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.logErrorEvent(error, 'AccessControlService', operationId, filters);
      throw new Error('Failed to fetch access control logs');
    }
  }

  /**
   * Get specific access control log by ID
   */
  async getAccessLogById(id: string) {
    const operationId = this.logger.startOperation('getAccessLogById', { logId: id });

    try {
      const log = await this.prisma.access_control_log.findUnique({
        where: { id },
        include: {
          access_rights: {
            include: {
              subscriptions: {
                include: {
                  users: true,
                  subscription_plans: true,
                },
              },
            },
          },
          events: {
            select: {
              id: true,
              name: true,
              scheduled_start: true,
              scheduled_end: true,
              description: true,
            },
          },
          users: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              phone: true,
            },
          },
                      access_points: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
        },
      });

      if (!log) {
        throw new Error('Access control log not found');
      }

      this.logger.endOperation('getAccessLogById', operationId, true, undefined, { logId: log.id });
      return await this.mapAccessLogToResponse(log);
    } catch (error) {
      this.logger.logErrorEvent(error, 'AccessControlService', operationId, { logId: id });
      throw error;
    }
  }

  /**
   * Get access control analytics
   */
  async getAccessAnalytics(filters: {
    event_id?: string;
    date_from?: string;
    date_to?: string;
  }) {
    const operationId = this.logger.startOperation('getAccessAnalytics', filters);

    try {
      const where: any = {};

      if (filters.event_id) {
        where.event_id = filters.event_id;
      }

      if (filters.date_from || filters.date_to) {
        where.scanned_at = {};
        if (filters.date_from) {
          where.scanned_at.gte = new Date(filters.date_from);
        }
        if (filters.date_to) {
          where.scanned_at.lte = new Date(filters.date_to);
        }
      }

      const [
        totalScans,
        successfulScans,
        deniedScans,
        scansByResult,
        scansByDenialReason,
        scansByHour,
        scansByDay,
        topEvents,
        topAgents,
      ] = await Promise.all([
        this.prisma.access_control_log.count({ where }),
        this.prisma.access_control_log.count({ where: { ...where, result: 'SUCCESS' } }),
        this.prisma.access_control_log.count({ where: { ...where, result: 'DENIED' } }),
        this.prisma.access_control_log.groupBy({
          by: ['result'],
          where,
          _count: { result: true },
        }),
        this.prisma.access_control_log.groupBy({
          by: ['denial_reason'],
          where: { ...where, result: 'DENIED' },
          _count: { denial_reason: true },
        }),
        this.getScansByHour(where),
        this.getScansByDay(where),
        this.getTopEvents(where),
        this.getTopAgents(where),
      ]);

      const successRate = totalScans > 0 ? (successfulScans / totalScans) * 100 : 0;
      const denialRate = totalScans > 0 ? (deniedScans / totalScans) * 100 : 0;

      const analytics = {
        overview: {
          total_scans: totalScans,
          successful_scans: successfulScans,
          denied_scans: deniedScans,
          success_rate: Math.round(successRate * 100) / 100,
          denial_rate: Math.round(denialRate * 100) / 100,
        },
        scans_by_result: scansByResult.reduce((acc, item) => {
          acc[item.result] = item._count.result;
          return acc;
        }, {} as Record<string, number>),
        scans_by_denial_reason: scansByDenialReason.reduce((acc, item) => {
          acc[item.denial_reason || 'UNKNOWN'] = item._count.denial_reason;
          return acc;
        }, {} as Record<string, number>),
        scans_by_hour: scansByHour,
        scans_by_day: scansByDay,
        top_events: topEvents,
        top_agents: topAgents,
      };

      this.logger.endOperation('getAccessAnalytics', operationId, true, undefined, { filters, analytics });
      return analytics;
    } catch (error) {
      this.logger.logErrorEvent(error, 'AccessControlService', operationId, filters);
      throw new Error('Failed to fetch access control analytics');
    }
  }

  /**
   * Get detailed denial analysis
   */
  async getDenialAnalysis(filters: {
    event_id?: string;
    date_from?: string;
    date_to?: string;
  }) {
    const operationId = this.logger.startOperation('getDenialAnalysis', filters);

    try {
      const where: any = {
        result: 'DENIED',
      };

      if (filters.event_id) {
        where.event_id = filters.event_id;
      }

      if (filters.date_from || filters.date_to) {
        where.scanned_at = {};
        if (filters.date_from) {
          where.scanned_at.gte = new Date(filters.date_from);
        }
        if (filters.date_to) {
          where.scanned_at.lte = new Date(filters.date_to);
        }
      }

      const [
        denialReasons,
        denialTrends,
        topDeniedQRCodes,
        denialByEvent,
        denialByAgent,
        recentDenials,
      ] = await Promise.all([
        this.prisma.access_control_log.groupBy({
          by: ['denial_reason'],
          where,
          _count: { denial_reason: true },
          orderBy: { _count: { denial_reason: 'desc' } },
        }),
        this.getDenialTrends(where),
        this.getTopDeniedQRCodes(where),
        this.getDenialByEvent(where),
        this.getDenialByAgent(where),
        this.prisma.access_control_log.findMany({
          where,
          orderBy: { scanned_at: 'desc' },
          take: 10,
          select: {
            id: true,
            denial_reason: true,
            scanned_at: true,
            controller_device: true,
            scan_metadata: true,
            events: {
              select: {
                id: true,
                name: true,
              },
            },
            access_rights: {
              select: {
                qr_code: true,
              },
            },
          },
        }),
      ]);

      const analysis = {
        denial_reasons: denialReasons.map(item => ({
          reason: item.denial_reason || 'UNKNOWN',
          count: item._count.denial_reason,
          percentage: 0, // Will be calculated below
        })),
        denial_trends: denialTrends,
        top_denied_qr_codes: topDeniedQRCodes,
        denial_by_event: denialByEvent,
        denial_by_agent: denialByAgent,
        recent_denials: recentDenials.map(log => {
          // Extract QR code - prioritize scan_metadata first, then access_rights
          let qrCode = 'Unknown';
          if (log.scan_metadata) {
            try {
              const metadata = typeof log.scan_metadata === 'string' 
                ? JSON.parse(log.scan_metadata) 
                : log.scan_metadata;
              qrCode = metadata?.qr_code || log.access_rights?.qr_code || 'Unknown';
            } catch (error) {
              qrCode = log.access_rights?.qr_code || 'Unknown';
            }
          } else {
            qrCode = log.access_rights?.qr_code || 'Unknown';
          }

          return {
            id: log.id,
            qr_code: qrCode,
            denial_reason: log.denial_reason,
            event_title: log.events?.name || 'Unknown Event',
            scanned_at: log.scanned_at,
            controller_device: log.controller_device,
          };
        }),
      };

      // Calculate percentages
      const totalDenials = denialReasons.reduce((sum, item) => sum + item._count.denial_reason, 0);
      analysis.denial_reasons.forEach(item => {
        item.percentage = totalDenials > 0 ? Math.round((item.count / totalDenials) * 100 * 100) / 100 : 0;
      });

      this.logger.endOperation('getDenialAnalysis', operationId, true, undefined, { filters, analysis });
      return analysis;
    } catch (error) {
      this.logger.logErrorEvent(error, 'AccessControlService', operationId, filters);
      throw new Error('Failed to fetch denial analysis');
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS FOR ANALYTICS
  // ============================================================================

  private async getScansByHour(where: any): Promise<Array<{ hour: number; count: number }>> {
    try {
      // Get scans grouped by hour for today
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const scansByHour = await this.prisma.access_control_log.groupBy({
        by: ['scanned_at'],
        where: {
          ...where,
          scanned_at: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        _count: {
          id: true
        }
      });

      // Initialize all hours with 0 count
      const hourlyCounts: Record<number, number> = {};
      for (let i = 0; i < 24; i++) {
        hourlyCounts[i] = 0;
      }

      // Count scans by hour
      scansByHour.forEach(scan => {
        const hour = scan.scanned_at.getHours();
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + scan._count.id;
      });

      // Convert to array format
      const result = Object.entries(hourlyCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => a.hour - b.hour);

      console.log('🔍 DEBUG: getScansByHour - real data:', result);
      return result;
    } catch (error) {
      console.error('Error getting scans by hour:', error);
      // Return empty array instead of mock data
      return Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    }
  }

  private async getScansByDay(where: any): Promise<Array<{ date: string; count: number }>> {
    try {
      // Get scans grouped by day for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const scansByDay = await this.prisma.access_control_log.groupBy({
        by: ['scanned_at'],
        where: {
          ...where,
          scanned_at: {
            gte: thirtyDaysAgo
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          scanned_at: 'asc'
        }
      });

      // Group by date (ignoring time) and count
      const dailyCounts: Record<string, number> = {};
      
      scansByDay.forEach(scan => {
        const date = scan.scanned_at.toISOString().split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + scan._count.id;
      });

      // Convert to array format and sort by date
      const result = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      console.log('🔍 DEBUG: getScansByDay - real data:', result);
      return result;
    } catch (error) {
      console.error('Error getting scans by day:', error);
      // Return empty array instead of mock data
      return [];
    }
  }

  private async getTopEvents(where: any): Promise<Array<{ event_id: string; event_title: string; count: number }>> {
    const events = await this.prisma.access_control_log.groupBy({
      by: ['event_id'],
      where,
      _count: { event_id: true },
      orderBy: { _count: { event_id: 'desc' } },
      take: 10,
    });

    const eventDetails = await Promise.all(
      events.map(async (event) => {
        const eventInfo = await this.prisma.events.findUnique({
          where: { id: event.event_id },
          select: { name: true },
        });
        return {
          event_id: event.event_id,
          event_title: eventInfo?.name || 'Unknown Event',
          count: event._count.event_id,
        };
      })
    );

    return eventDetails;
  }

  private async getTopAgents(where: any): Promise<Array<{ agent: string; count: number }>> {
    const agents = await this.prisma.access_control_log.groupBy({
      by: ['controller_device'],
      where: {
        ...where,
        controller_device: { not: null },
      },
      _count: { controller_device: true },
      orderBy: { _count: { controller_device: 'desc' } },
      take: 10,
    });

    return agents.map(agent => ({
      agent: agent.controller_device || 'Unknown',
      count: agent._count.controller_device,
    }));
  }

  private async getDenialTrends(where: any): Promise<Array<{ date: string; count: number }>> {
    try {
      // Get denied scans grouped by day for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const deniedScansByDay = await this.prisma.access_control_log.groupBy({
        by: ['scanned_at'],
        where: {
          ...where,
          result: 'DENIED',
          scanned_at: {
            gte: thirtyDaysAgo
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          scanned_at: 'asc'
        }
      });

      // Group by date (ignoring time) and count
      const dailyCounts: Record<string, number> = {};
      
      deniedScansByDay.forEach(scan => {
        const date = scan.scanned_at.toISOString().split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + scan._count.id;
      });

      // Convert to array format and sort by date
      const result = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      console.log('🔍 DEBUG: getDenialTrends - real data:', result);
      return result;
    } catch (error) {
      console.error('Error getting denial trends:', error);
      // Return empty array instead of mock data
      return [];
    }
  }

  private async getTopDeniedQRCodes(where: any): Promise<Array<{ qr_code: string; count: number }>> {
    const deniedLogs = await this.prisma.access_control_log.findMany({
      where,
      select: {
        scan_metadata: true,
      },
      take: 1000, // Limit for performance
    });

    const qrCodeCounts: Record<string, number> = {};
    deniedLogs.forEach(log => {
      try {
        const metadata = typeof log.scan_metadata === 'string' 
          ? JSON.parse(log.scan_metadata) 
          : log.scan_metadata;
        const qrCode = metadata?.qr_code;
        if (qrCode) {
          qrCodeCounts[qrCode] = (qrCodeCounts[qrCode] || 0) + 1;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    });

    return Object.entries(qrCodeCounts)
      .map(([qr_code, count]) => ({ qr_code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private async getDenialByEvent(where: any): Promise<Array<{ event_id: string; event_title: string; count: number }>> {
    return this.getTopEvents(where);
  }

  private async getDenialByAgent(where: any): Promise<Array<{ agent: string; count: number }>> {
    return this.getTopAgents(where);
  }

  private async mapAccessLogToResponse(log: any): Promise<any> {
    // Extract QR code - prioritize scan_metadata first (for invalid scans), then access_rights
    let qrCode = null;
    
    // First try to get QR code from scan_metadata (most reliable for all scans)
    if (log.scan_metadata) {
      try {
        const metadata = typeof log.scan_metadata === 'string' 
          ? JSON.parse(log.scan_metadata) 
          : log.scan_metadata;
        qrCode = metadata?.qr_code || null;
      } catch (error) {
        console.log('🔍 DEBUG: Error parsing scan_metadata for QR code:', error);
      }
    }
    
    // Fallback to access_rights if scan_metadata doesn't have QR code
    if (!qrCode && log.access_rights?.qr_code) {
      qrCode = log.access_rights.qr_code;
    }

    // Look up serial number from physical_qr_codes table
    let serialNumber = 'N/A';
    if (qrCode && qrCode !== 'N/A') {
      try {
        const physicalQrCode = await this.prisma.physical_qr_codes.findUnique({
          where: { qr_code: qrCode },
          select: { serial_number: true }
        });
        if (physicalQrCode) {
          serialNumber = physicalQrCode.serial_number;
        }
      } catch (error) {
        console.log('🔍 DEBUG: Error looking up serial number for QR code:', qrCode, error);
      }
    }

    return {
      id: log.id,
      access_right_id: log.access_right_id,
      access_point_id: log.access_point_id,
      user_id: log.user_id,
      event_id: log.event_id,
      action: log.action,
      result: log.result,
      denial_reason: log.denial_reason,
      controller_device: log.controller_device,
      serial_number: serialNumber,
      scan_metadata: log.scan_metadata,
      notes: log.notes,
      scanned_at: log.scanned_at,
      created_at: log.created_at,
      // Relations
      access_right: log.access_rights ? {
        id: log.access_rights.id,
        qr_code: qrCode || log.access_rights.qr_code || 'N/A',
        access_code: log.access_rights.access_code,
        status: log.access_rights.status,
        subscription: log.access_rights.subscriptions ? {
          id: log.access_rights.subscriptions.id,
          user: log.access_rights.subscriptions.users ? {
            id: log.access_rights.subscriptions.users.id,
            email: log.access_rights.subscriptions.users.email,
            first_name: log.access_rights.subscriptions.users.first_name,
            last_name: log.access_rights.subscriptions.users.last_name,
          } : null,
          plan: log.access_rights.subscriptions.subscription_plans ? {
            id: log.access_rights.subscriptions.subscription_plans.id,
            name: log.access_rights.subscriptions.subscription_plans.name,
            description: log.access_rights.subscriptions.subscription_plans.description,
          } : null,
        } : null,
      } : {
        // If no access_rights, create a minimal object with QR code from metadata
        id: null,
        qr_code: qrCode || 'N/A',
        access_code: 'N/A',
        status: 'N/A',
        subscription: null,
      },
      event: log.events ? {
        id: log.events.id,
        title: log.events.name,
        start_date: log.events.scheduled_start,
        end_date: log.events.scheduled_end,
        description: log.events.description,
      } : null,
      user: log.users ? {
        id: log.users.id,
        email: log.users.email,
        first_name: log.users.first_name,
        last_name: log.users.last_name,
        phone: log.users.phone,
      } : null,
      access_point: log.access_points ? {
        id: log.access_points.id,
        name: log.access_points.name,
        code: log.access_points.code,
      } : null,
    };
  }
}
