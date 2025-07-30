import { LoggerService } from '../../../shared/logger/logger.service';
import { Role } from '../interfaces/rbac.interface';
interface RoleNode {
    role: Role;
    parents: RoleNode[];
    children: RoleNode[];
    depth: number;
}
export declare class HierarchyResolver {
    private readonly logger;
    constructor(loggerService: LoggerService);
    buildRoleHierarchy(roles: Role[], hierarchyRelations: Array<{
        parent_role_id: string;
        child_role_id: string;
    }>): Map<string, RoleNode>;
    resolveInheritedRoles(roleId: string, hierarchyMap: Map<string, RoleNode>): {
        inherited_roles: Role[];
        inheritance_chain: string[];
        max_depth: number;
    };
    findRoleDescendants(roleId: string, hierarchyMap: Map<string, RoleNode>): {
        direct_children: Role[];
        all_descendants: Role[];
        descendant_tree: any;
    };
    inheritsFrom(childRoleId: string, parentRoleId: string, hierarchyMap: Map<string, RoleNode>): {
        inherits: boolean;
        inheritance_path: string[];
        depth: number;
    };
    optimizeHierarchy(hierarchyMap: Map<string, RoleNode>): {
        redundant_relations: Array<{
            parent: string;
            child: string;
            reason: string;
        }>;
        optimization_suggestions: string[];
        complexity_score: number;
    };
    private calculateDepths;
    private validateHierarchy;
    private hasCycle;
    private traverseParents;
    private traverseChildren;
    private buildDescendantTree;
    private findInheritancePath;
    private detectRedundantRelations;
    private calculateComplexityScore;
}
export {};
