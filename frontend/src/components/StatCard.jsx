import React from 'react';

const StatCard = ({ title, value, trend, icon, trendUp = true, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="group relative overflow-hidden bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl transition-all duration-500 hover:shadow-primary/20 hover:-translate-y-1 cursor-pointer"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[80px] -z-0 transition-all group-hover:scale-150 group-hover:bg-primary/10" />
            
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                        {React.cloneElement(icon, { size: 28, strokeWidth: 2.5 })}
                    </div>
                    {trend && (
                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                            trendUp 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${trendUp ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            {trend}
                        </div>
                    )}
                </div>
                
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">{title}</p>
                    <h2 className="text-3xl font-black tracking-tighter group-hover:text-primary transition-colors duration-300">
                        {value}
                    </h2>
                </div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};

export default StatCard;
