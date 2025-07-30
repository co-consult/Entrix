"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HierarchyResolver = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../../shared/logger/logger.service");
let HierarchyResolver = class HierarchyResolver {
    logger;
    constructor(loggerService) {
        this.logger = loggerService.createChildLogger('HierarchyResolver');
    }
    buildRoleHierarchy(roles, hierarchyRelations) {
        const nodeMap = new Map();
        for (const role of roles) {
            nodeMap.set(role.id, {
                role,
                parents: [],
                children: [],
                depth: 0,
            });
        }
        for (const relation of hierarchyRelations) {
            const parentNode = nodeMap.get(relation.parent_role_id);
            const childNode = nodeMap.get(relation.child_role_id);
            if (parentNode && childNode) {
                parentNode.children.push(childNode);
                childNode.parents.push(parentNode);
            }
        }
        this.calculateDepths(nodeMap);
        this.validateHierarchy(nodeMap);
        return nodeMap;
    }
    resolveInheritedRoles(roleId, hierarchyMap) {
        const startNode = hierarchyMap.get(roleId);
        if (!startNode) {
            return {
                inherited_roles: [],
                inheritance_chain: [],
                max_depth: 0,
            };
        }
        const inheritedRoles = [];
        const inheritanceChain = [];
        const visited = new Set();
        this.traverseParents(startNode, inheritedRoles, inheritanceChain, visited);
        return {
            inherited_roles: inheritedRoles,
            inheritance_chain: inheritanceChain,
            max_depth: Math.max(...inheritanceChain.map(chain => chain.split('->').length)),
        };
    }
    findRoleDescendants(roleId, hierarchyMap) {
        const startNode = hierarchyMap.get(roleId);
        if (!startNode) {
            return {
                direct_children: [],
                all_descendants: [],
                descendant_tree: {},
            };
        }
        const directChildren = startNode.children.map(child => child.role);
        const allDescendants = [];
        const visited = new Set();
        this.traverseChildren(startNode, allDescendants, visited);
        return {
            direct_children: directChildren,
            all_descendants: allDescendants,
            descendant_tree: this.buildDescendantTree(startNode),
        };
    }
    inheritsFrom(childRoleId, parentRoleId, hierarchyMap) {
        const childNode = hierarchyMap.get(childRoleId);
        const parentNode = hierarchyMap.get(parentRoleId);
        if (!childNode || !parentNode) {
            return {
                inherits: false,
                inheritance_path: [],
                depth: 0,
            };
        }
        const path = [];
        const inherits = this.findInheritancePath(childNode, parentNode, path, new Set());
        return {
            inherits,
            inheritance_path: inherits ? path : [],
            depth: path.length,
        };
    }
    optimizeHierarchy(hierarchyMap) {
        const redundantRelations = [];
        const suggestions = [];
        for (const [roleId, node] of hierarchyMap) {
            this.detectRedundantRelations(node, redundantRelations);
        }
        const complexityScore = this.calculateComplexityScore(hierarchyMap);
        if (complexityScore > 50) {
            suggestions.push('Considérer la simplification de la hiérarchie');
        }
        if (redundantRelations.length > 0) {
            suggestions.push('Supprimer les relations redondantes détectées');
        }
        return {
            redundant_relations: redundantRelations,
            optimization_suggestions: suggestions,
            complexity_score: complexityScore,
        };
    }
    calculateDepths(nodeMap) {
        const rootNodes = Array.from(nodeMap.values()).filter(node => node.parents.length === 0);
        const queue = rootNodes.map(node => ({ node, depth: 0 }));
        const visited = new Set();
        while (queue.length > 0) {
            const { node, depth } = queue.shift();
            if (visited.has(node.role.id)) {
                continue;
            }
            visited.add(node.role.id);
            node.depth = depth;
            for (const child of node.children) {
                if (!visited.has(child.role.id)) {
                    queue.push({ node: child, depth: depth + 1 });
                }
            }
        }
    }
    validateHierarchy(nodeMap) {
        const visited = new Set();
        const recursionStack = new Set();
        for (const [roleId, node] of nodeMap) {
            if (!visited.has(roleId)) {
                if (this.hasCycle(node, visited, recursionStack)) {
                    throw new Error(`Cycle détecté dans la hiérarchie des rôles impliquant ${roleId}`);
                }
            }
        }
    }
    hasCycle(node, visited, recursionStack) {
        visited.add(node.role.id);
        recursionStack.add(node.role.id);
        for (const child of node.children) {
            if (!visited.has(child.role.id)) {
                if (this.hasCycle(child, visited, recursionStack)) {
                    return true;
                }
            }
            else if (recursionStack.has(child.role.id)) {
                return true;
            }
        }
        recursionStack.delete(node.role.id);
        return false;
    }
    traverseParents(node, inheritedRoles, inheritanceChain, visited) {
        if (visited.has(node.role.id)) {
            return;
        }
        visited.add(node.role.id);
        for (const parent of node.parents) {
            inheritedRoles.push(parent.role);
            inheritanceChain.push(`${node.role.name}->${parent.role.name}`);
            this.traverseParents(parent, inheritedRoles, inheritanceChain, visited);
        }
    }
    traverseChildren(node, descendants, visited) {
        if (visited.has(node.role.id)) {
            return;
        }
        visited.add(node.role.id);
        for (const child of node.children) {
            descendants.push(child.role);
            this.traverseChildren(child, descendants, visited);
        }
    }
    buildDescendantTree(node) {
        const tree = {
            role: {
                id: node.role.id,
                name: node.role.name,
                level: node.role.level,
            },
            children: [],
        };
        for (const child of node.children) {
            tree.children.push(this.buildDescendantTree(child));
        }
        return tree;
    }
    findInheritancePath(childNode, targetParentNode, path, visited) {
        if (visited.has(childNode.role.id)) {
            return false;
        }
        visited.add(childNode.role.id);
        path.push(childNode.role.name);
        if (childNode.role.id === targetParentNode.role.id) {
            return true;
        }
        for (const parent of childNode.parents) {
            if (this.findInheritancePath(parent, targetParentNode, path, visited)) {
                return true;
            }
        }
        path.pop();
        return false;
    }
    detectRedundantRelations(node, redundantRelations) {
    }
    calculateComplexityScore(hierarchyMap) {
        let score = 0;
        for (const [roleId, node] of hierarchyMap) {
            score += node.parents.length * 2;
            score += node.children.length * 1.5;
            if (node.depth > 5) {
                score += (node.depth - 5) * 3;
            }
        }
        return Math.round(score);
    }
};
exports.HierarchyResolver = HierarchyResolver;
exports.HierarchyResolver = HierarchyResolver = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], HierarchyResolver);
//# sourceMappingURL=hierarchy-resolver.js.map