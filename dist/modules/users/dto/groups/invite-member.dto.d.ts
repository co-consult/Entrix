declare class SingleInviteDto {
    email?: string;
    userId?: string;
    name?: string;
    role: string;
}
export declare class InviteMemberDto {
    email?: string;
    userId?: string;
    name?: string;
    role?: string;
    invitations?: SingleInviteDto[];
    message?: string;
    expiresInHours?: number;
    sendEmail?: boolean;
    sendSms?: boolean;
}
export {};
