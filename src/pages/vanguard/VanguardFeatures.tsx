/**
 * Vanguard Features Page
 * Comprehensive display of all platform capabilities
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  VANGUARD_FEATURE_CATEGORIES, 
  FEATURE_STATS,
  type FeatureCategory,
  type Feature
} from '@/config/vanguardFeatures';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  ChevronRight, 
  Search, 
  Sparkles, 
  Crown, 
  Clock, 
  ArrowRight,
  Filter,
  LayoutGrid,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/SEOHead';
import { getVanguardBasePath } from '@/utils/subdomain';

const colorMap: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', gradient: 'from-cyan-500 to-cyan-600' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', gradient: 'from-purple-500 to-purple-600' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', gradient: 'from-violet-500 to-violet-600' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', gradient: 'from-blue-500 to-blue-600' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', gradient: 'from-green-500 to-green-600' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', gradient: 'from-orange-500 to-orange-600' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', gradient: 'from-red-500 to-red-600' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', gradient: 'from-amber-500 to-amber-600' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', gradient: 'from-rose-500 to-rose-600' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', gradient: 'from-emerald-500 to-emerald-600' },
  sky: { bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-400', gradient: 'from-sky-500 to-sky-600' },
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', gradient: 'from-indigo-500 to-indigo-600' },
  slate: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', gradient: 'from-slate-500 to-slate-600' },
  teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400', gradient: 'from-teal-500 to-teal-600' },
};

const FeatureCard = ({ feature, color, categoryId }: { feature: Feature; color: string; categoryId: string }) => {
  const colors = colorMap[color] || colorMap.cyan;
  const basePath = getVanguardBasePath();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "h-full bg-slate-900/50 border-slate-700/50 hover:border-slate-600 transition-all group",
        feature.comingSoon && "opacity-75"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className={cn(
              "p-2 rounded-lg w-fit",
              colors.bg,
              colors.border,
              "border"
            )}>
              <feature.icon className={cn("h-5 w-5", colors.text)} />
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              {feature.isNew && (
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  New
                </Badge>
              )}
              {feature.isPremium && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
              {feature.comingSoon && (
                <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Coming Soon
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-white text-lg mt-2">{feature.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-slate-400 text-sm leading-relaxed">
            {feature.description}
          </CardDescription>
          {feature.route && !feature.comingSoon && (
            <Link 
              to={feature.route} 
              className={cn(
                "inline-flex items-center gap-1 mt-3 text-sm font-medium transition-colors",
                colors.text,
                "hover:underline group-hover:gap-2"
              )}
            >
              Learn more
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const CategorySection = ({ category, isExpanded }: { category: FeatureCategory; isExpanded: boolean }) => {
  const colors = colorMap[category.color] || colorMap.cyan;
  
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className="mb-12"
      id={category.id}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className={cn(
          "p-3 rounded-xl",
          colors.bg,
          colors.border,
          "border"
        )}>
          <category.icon className={cn("h-6 w-6", colors.text)} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{category.name}</h2>
          <p className="text-slate-400">{category.description}</p>
        </div>
        <Badge variant="outline" className="ml-auto text-slate-400 border-slate-600">
          {category.features.length} features
        </Badge>
      </div>
      
      <div className={cn(
        "grid gap-4",
        isExpanded 
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      )}>
        {category.features.map((feature) => (
          <FeatureCard 
            key={feature.id} 
            feature={feature} 
            color={category.color}
            categoryId={category.id}
          />
        ))}
      </div>
    </motion.section>
  );
};

export default function VanguardFeatures() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'premium'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const basePath = getVanguardBasePath();
  
  // Filter categories and features based on search and filter
  const filteredCategories = VANGUARD_FEATURE_CATEGORIES.map(category => ({
    ...category,
    features: category.features.filter(feature => {
      const matchesSearch = searchQuery === '' || 
        feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = 
        activeFilter === 'all' ||
        (activeFilter === 'new' && feature.isNew) ||
        (activeFilter === 'premium' && feature.isPremium);
      
      return matchesSearch && matchesFilter;
    })
  })).filter(category => category.features.length > 0);
  
  const totalFilteredFeatures = filteredCategories.reduce(
    (acc, cat) => acc + cat.features.length, 0
  );

  return (
    <>
      <SEOHead 
        title="Vanguard Features | Complete MSP & Security Platform"
        description="Explore all Vanguard features: RMM, PSA, security operations, vulnerability management, penetration testing, and AI-powered IT automation."
        keywords="MSP platform features, RMM software, PSA solution, security operations, vulnerability scanning, penetration testing"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Hero Section */}
        <div className="relative overflow-hidden border-b border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
          
          <div className="container mx-auto px-4 py-16 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                <Sparkles className="h-3 w-3 mr-1" />
                {FEATURE_STATS.totalFeatures}+ Features
              </Badge>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                All-in-One Platform for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  IT Professionals
                </span>
              </h1>
              
              <p className="text-xl text-slate-400 mb-8">
                From remote monitoring & management to advanced security operations, 
                Vanguard brings your entire IT business together with AI-powered automation.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to={`${basePath}/auth`}>
                  <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to={`${basePath}/trust`}>
                  <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                    Trust Center
                  </Button>
                </Link>
              </div>
            </motion.div>
            
            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-2xl mx-auto"
            >
              {[
                { label: 'Total Features', value: FEATURE_STATS.totalFeatures },
                { label: 'Categories', value: FEATURE_STATS.totalCategories },
                { label: 'New Features', value: FEATURE_STATS.newFeatures },
                { label: 'Coming Soon', value: FEATURE_STATS.comingSoonFeatures }
              ].map((stat, i) => (
                <div key={i} className="text-center p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="text-2xl font-bold text-cyan-400">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
        
        {/* Quick Navigation */}
        <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              
              <div className="flex items-center gap-4">
                {/* Filters */}
                <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)}>
                  <TabsList className="bg-slate-800 border border-slate-700">
                    <TabsTrigger value="all" className="data-[state=active]:bg-slate-700">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="new" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                      <Sparkles className="h-3 w-3 mr-1" />
                      New
                    </TabsTrigger>
                    <TabsTrigger value="premium" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-2 rounded transition-colors",
                      viewMode === 'grid' ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-2 rounded transition-colors",
                      viewMode === 'list' ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Category Quick Links */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              {VANGUARD_FEATURE_CATEGORIES.map((cat) => {
                const colors = colorMap[cat.color] || colorMap.cyan;
                return (
                  <a
                    key={cat.id}
                    href={`#${cat.id}`}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
                      "bg-slate-800 border border-slate-700 hover:border-slate-600",
                      colors.text
                    )}
                  >
                    <cat.icon className="h-3.5 w-3.5" />
                    {cat.name}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-slate-400">
              Showing <span className="text-white font-semibold">{totalFilteredFeatures}</span> features
              {searchQuery && (
                <> matching "<span className="text-cyan-400">{searchQuery}</span>"</>
              )}
            </p>
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-white"
              >
                Clear search
              </Button>
            )}
          </div>
          
          {/* Feature Categories */}
          <AnimatePresence mode="wait">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <CategorySection 
                  key={category.id} 
                  category={category}
                  isExpanded={viewMode === 'grid'}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Filter className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No features found</h3>
                <p className="text-slate-400">
                  Try adjusting your search or filter criteria.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4 border-slate-600"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                >
                  Reset filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* CTA Section */}
        <div className="border-t border-slate-800 bg-slate-900/50">
          <div className="container mx-auto px-4 py-16 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to experience all these features?
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Start your free trial today and see why MSPs choose Vanguard for their 
              complete IT management and security needs.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to={`${basePath}/auth`}>
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600">
                  Start Free Trial
                </Button>
              </Link>
              <Link to={`${basePath}/pricing`}>
                <Button size="lg" variant="outline" className="border-slate-600 text-slate-300">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
