"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Calendar,
  Filter,
  Download,
  BarChart3,
  PieChart,
  ShoppingCart,
  UserCheck,
  Clock,
  X
} from "lucide-react";
import { CustomCurrencyIcon } from "@/components/ui/custom-currency-icon";
import { subscriptionsApi } from "@/lib/api/subscriptions";
import { apiClient } from '@/lib/api-client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VendorStats {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  totalSales: number;
  totalRevenue: number;
  totalSubscriptions: number;
  averageOrderValue: number;
  paymentMethods: {
    [key: string]: {
      count: number;
      revenue: number;
    };
  };
  monthlyStats: {
    [key: string]: {
      sales: number;
      revenue: number;
      subscriptions: number;
    };
  };
}

interface FilterOptions {
  vendorId: string;
  timeRange: 'week' | 'month' | 'quarter' | 'year' | 'all';
  paymentMethod: string;
  startDate: string;
  endDate: string;
}

export default function AdvancedStatsModal({ open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<VendorStats[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    vendorId: 'all',
    timeRange: 'month',
    paymentMethod: 'all',
    startDate: '',
    endDate: ''
  });
  const [summaryStats, setSummaryStats] = useState({
    totalVendors: 0,
    totalRevenue: 0,
    totalSales: 0,
    totalSubscriptions: 0,
    averageOrderValue: 0
  });
  const { toast } = useToast();

  // Load vendors and payment methods on mount
  useEffect(() => {
    if (open) {
      console.log('AdvancedStatsModal opened, loading vendors...');
      loadVendors();
      loadPaymentMethods();
    }
  }, [open]);

  // Load stats when filters change or vendors are loaded
  useEffect(() => {
    if (open && vendors.length > 0) {
      loadStats();
    }
  }, [open, filters, vendors]);

    const loadVendors = async () => {
    setVendorsLoading(true);
    try {
      // Use the dedicated filter options endpoint for better performance
      const filterData = await subscriptionsApi.getFilterOptions() as any;
      
      if (filterData && filterData.vendors) {
        setVendors(filterData.vendors);
        console.log('Vendors loaded from filter options:', filterData.vendors.length);
      } else {
        setVendors([]);
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
      setVendors([]);
    } finally {
      setVendorsLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      // Use the dedicated filter options endpoint for better performance
      const filterData = await subscriptionsApi.getFilterOptions() as any;
      
      if (filterData && filterData.paymentMethods) {
        setPaymentMethods(filterData.paymentMethods);
      } else {
        setPaymentMethods([]);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      setPaymentMethods([]);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      // Build filters for the API call
      const apiFilters: any = {};
      
      if (filters.vendorId !== 'all') {
        apiFilters.vendorId = filters.vendorId;
      }
      
      if (filters.paymentMethod !== 'all') {
        apiFilters.paymentMethod = filters.paymentMethod;
      }
      
      if (filters.startDate) {
        apiFilters.createdAfter = filters.startDate;
      }
      
      if (filters.endDate) {
        apiFilters.createdBefore = filters.endDate;
      }
      
      // Add time range filter
      if (filters.timeRange !== 'all') {
        const now = new Date();
        let cutoffDate = new Date();
        
        switch (filters.timeRange) {
          case 'week':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            cutoffDate.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        if (!apiFilters.createdAfter || new Date(apiFilters.createdAfter) < cutoffDate) {
          apiFilters.createdAfter = cutoffDate.toISOString().split('T')[0];
        }
      }
      
      // For now, we'll use a simplified approach for vendor stats
      // In a real implementation, you'd want a dedicated vendor stats endpoint
      const response = await subscriptionsApi.getAll({ ...apiFilters }); // No limit - fetch all records
      const subs = Array.isArray(response) ? response : (response?.data || []);
      
      // Simplified vendor stats calculation
      const vendorStats: { [key: string]: VendorStats } = {};
      
      subs.forEach((sub: any) => {
        const metadata = sub.metadata || {};
        const sellerId = (metadata.createdBy || metadata.sellerId || 'unknown').toString();
        
        // Find vendor info from the vendors list
        const vendorInfo = vendors.find(v => v.id === sellerId);
        const sellerName = vendorInfo ? 
          (vendorInfo.name || vendorInfo.email) :
          (metadata.sellerName || metadata.createdBy || 'Vendeur inconnu').toString();
        const sellerEmail = vendorInfo ? vendorInfo.email : (metadata.sellerEmail || 'email@inconnu.com').toString();
        
        const price = parseFloat(sub.price_paid || sub.subscription_plans?.price || 0) || 0;
        const method = (metadata.paymentMethod || metadata.payment_method || 'UNKNOWN').toString();
        
        // Check if this is a no-price user (sponsor/partner)
        const isNoPriceUser = metadata?.isNoPriceUser === true;
        
        if (!vendorStats[sellerId]) {
          vendorStats[sellerId] = {
            vendorId: sellerId,
            vendorName: sellerName,
            vendorEmail: sellerEmail,
            totalSales: 0,
            totalRevenue: 0,
            totalSubscriptions: 0,
            averageOrderValue: 0,
            paymentMethods: {},
            monthlyStats: {}
          };
        }
        
        vendorStats[sellerId].totalSales++;
        // Only add revenue for non-sponsor/partner users
        if (!isNoPriceUser) {
          vendorStats[sellerId].totalRevenue += price;
        }
        vendorStats[sellerId].totalSubscriptions++;
        
        if (!vendorStats[sellerId].paymentMethods[method]) {
          vendorStats[sellerId].paymentMethods[method] = { count: 0, revenue: 0 };
        }
        vendorStats[sellerId].paymentMethods[method].count++;
        // Only add revenue for non-sponsor/partner users
        if (!isNoPriceUser) {
          vendorStats[sellerId].paymentMethods[method].revenue += price;
        }
      });
      
      const statsArray = Object.values(vendorStats).map(vendor => ({
        ...vendor,
        averageOrderValue: vendor.totalSales > 0 ? vendor.totalRevenue / vendor.totalSales : 0
      }));
      
      setStats(statsArray);
      
      // Get summary stats from the dedicated endpoint
      const statsData = await subscriptionsApi.getStats(apiFilters);
      
      if (statsData && typeof statsData === 'object') {
        setSummaryStats({
          totalVendors: statsArray.length, // Use actual vendor stats count
          totalRevenue: (statsData as any).total_revenue || 0,
          totalSales: (statsData as any).total_subscriptions || 0,
          totalSubscriptions: (statsData as any).total_subscriptions || 0,
          averageOrderValue: (statsData as any).avg_subscription_value || 0
        });
      }
      
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const exportData = stats.map(vendor => ({
        'Vendeur': vendor.vendorName,
        'Email': vendor.vendorEmail,
        'Ventes Totales': vendor.totalSales,
        'Revenus Totaux': `${vendor.totalRevenue.toFixed(2)} TND`,
        'Abonnements': vendor.totalSubscriptions,
        'Valeur Moyenne': `${vendor.averageOrderValue.toFixed(2)} TND`,
        'Méthodes de Paiement': Object.keys(vendor.paymentMethods).join(', ')
      }));

      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const columnWidths = [
        { wch: 25 }, // Vendeur
        { wch: 30 }, // Email
        { wch: 15 }, // Ventes Totales
        { wch: 20 }, // Revenus Totaux
        { wch: 15 }, // Abonnements
        { wch: 20 }, // Valeur Moyenne
        { wch: 30 }  // Méthodes de Paiement
      ];
      worksheet['!cols'] = columnWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Statistiques Vendeurs');
      XLSX.writeFile(workbook, `statistiques_vendeurs_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "Export réussi",
        description: "Les statistiques ont été exportées avec succès",
        variant: "default"
      });
    } catch (error) {
      console.error('Error exporting stats:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les statistiques",
        variant: "destructive"
      });
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: { [key: string]: string } = {
      'CASH': 'Espèces',
      'CARD': 'Carte bancaire',
      'FLOUCI': 'Flouci',
      'BANK_TRANSFER': 'Virement bancaire',
      'SOCIOS': 'Socios',
      'CHEQUE': 'Chèque',
      'NO_FEE': 'Aucun frais',
      'UNKNOWN': 'Inconnu'
    };
    return labels[method] || method;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] p-0 bg-white overflow-hidden">
        <DialogHeader className="bg-white p-4 border-b">
          <DialogTitle className="text-xl font-bold flex items-center gap-3 text-black">
            <BarChart3 className="h-6 w-6" />
            Statistiques Avancées - Vendeurs
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                 <div>
                   <Label className="text-sm font-medium text-gray-700">Vendeur</Label>
                   <Select value={filters.vendorId} onValueChange={(value) => setFilters(prev => ({ ...prev, vendorId: value }))} disabled={vendorsLoading}>
                     <SelectTrigger>
                       <SelectValue placeholder={vendorsLoading ? "Chargement..." : "Tous les vendeurs"} />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">Tous les vendeurs</SelectItem>
                       {vendorsLoading ? (
                         <SelectItem value="loading" disabled>
                           Chargement des vendeurs...
                         </SelectItem>
                       ) : (
                         <>
                           {vendors.map(vendor => (
                             <SelectItem key={vendor.id} value={vendor.id}>
                               {vendor.name || `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim() || vendor.email}
                             </SelectItem>
                           ))}
                           {vendors.length === 0 && (
                             <SelectItem value="none" disabled>
                               Aucun vendeur trouvé
                             </SelectItem>
                           )}
                         </>
                       )}
                     </SelectContent>
                   </Select>
                 </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Période</Label>
                  <Select value={filters.timeRange} onValueChange={(value: any) => setFilters(prev => ({ ...prev, timeRange: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Cette semaine</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                      <SelectItem value="quarter">Ce trimestre</SelectItem>
                      <SelectItem value="year">Cette année</SelectItem>
                      <SelectItem value="all">Toutes les périodes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Méthode de Paiement</Label>
                  <Select value={filters.paymentMethod} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les méthodes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les méthodes</SelectItem>
                      {paymentMethods.map(method => (
                        <SelectItem key={method} value={method}>
                          {getPaymentMethodLabel(method)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Date de début</Label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

                     {/* Summary Stats */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
             <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
               <CardHeader className="flex flex-row items-center justify-between pb-1 px-4 py-3">
                 <CardTitle className="text-xs font-medium">Vendeurs</CardTitle>
                 <Users className="h-4 w-4 text-blue-500" />
               </CardHeader>
               <CardContent className="px-4 pb-3">
                 <div className="text-lg font-bold">{summaryStats.totalVendors}</div>
                 <p className="text-xs text-muted-foreground">Vendeurs actifs</p>
               </CardContent>
             </Card>

             <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
               <CardHeader className="flex flex-row items-center justify-between pb-1 px-4 py-3">
                 <CardTitle className="text-xs font-medium">Revenus</CardTitle>
                 <CustomCurrencyIcon className="h-4 w-4 text-green-500" />
               </CardHeader>
               <CardContent className="px-4 pb-3">
                 <div className="text-lg font-bold">{summaryStats.totalRevenue.toFixed(2)} TND</div>
                 <p className="text-xs text-muted-foreground">Revenus totaux</p>
               </CardContent>
             </Card>

             <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
               <CardHeader className="flex flex-row items-center justify-between pb-1 px-4 py-3">
                 <CardTitle className="text-xs font-medium">Ventes</CardTitle>
                 <ShoppingCart className="h-4 w-4 text-purple-500" />
               </CardHeader>
               <CardContent className="px-4 pb-3">
                 <div className="text-lg font-bold">{summaryStats.totalSales}</div>
                 <p className="text-xs text-muted-foreground">Ventes totales</p>
               </CardContent>
             </Card>

             <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
               <CardHeader className="flex flex-row items-center justify-between pb-1 px-4 py-3">
                 <CardTitle className="text-xs font-medium">Abonnements</CardTitle>
                 <UserCheck className="h-4 w-4 text-orange-500" />
               </CardHeader>
               <CardContent className="px-4 pb-3">
                 <div className="text-lg font-bold">{summaryStats.totalSubscriptions}</div>
                 <p className="text-xs text-muted-foreground">Abonnements créés</p>
               </CardContent>
             </Card>

             <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
               <CardHeader className="flex flex-row items-center justify-between pb-1 px-4 py-3">
                 <CardTitle className="text-xs font-medium">Valeur Moyenne</CardTitle>
                 <TrendingUp className="h-4 w-4 text-indigo-500" />
               </CardHeader>
               <CardContent className="px-4 pb-3">
                 <div className="text-lg font-bold">{summaryStats.averageOrderValue.toFixed(2)} TND</div>
                 <p className="text-xs text-muted-foreground">Par vente</p>
               </CardContent>
             </Card>
           </div>

          {/* Vendor Stats Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Statistiques par Vendeur
              </CardTitle>
              <Button onClick={handleExport} variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exporter
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                  <span className="ml-2">Chargement des statistiques...</span>
                </div>
              ) : stats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucune donnée trouvée avec les filtres actuels
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Vendeur</th>
                        <th className="text-left p-2 font-medium">Email</th>
                        <th className="text-right p-2 font-medium">Ventes</th>
                        <th className="text-right p-2 font-medium">Revenus</th>
                        <th className="text-right p-2 font-medium">Abonnements</th>
                        <th className="text-right p-2 font-medium">Valeur Moy.</th>
                        <th className="text-left p-2 font-medium">Méthodes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map((vendor, index) => (
                        <tr key={vendor.vendorId} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                          <td className="p-2 font-medium">{vendor.vendorName}</td>
                          <td className="p-2 text-gray-600">{vendor.vendorEmail}</td>
                          <td className="p-2 text-right">{vendor.totalSales}</td>
                          <td className="p-2 text-right font-medium text-green-600">
                            {vendor.totalRevenue.toFixed(2)} TND
                          </td>
                          <td className="p-2 text-right">{vendor.totalSubscriptions}</td>
                          <td className="p-2 text-right">{vendor.averageOrderValue.toFixed(2)} TND</td>
                          <td className="p-2">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(vendor.paymentMethods).map(([method, data]) => (
                                <Badge key={method} variant="outline" className="text-xs">
                                  {getPaymentMethodLabel(method)} ({data.count})
                                </Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
} 