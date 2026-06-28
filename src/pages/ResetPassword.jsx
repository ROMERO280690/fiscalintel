import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Enlace inválido"
        subtitle="Este enlace para restablecer contraseña es inválido o no existe"
        footer={
          <Link to="/forgot-password" className="text-[#00C7D9] font-medium hover:underline">
            Solicitar nuevo enlace
          </Link>
        }
      >
        <p className="text-sm text-slate-300 text-center">
          El enlace que usaste parece estar incompleto. Por favor, solicitá un nuevo email de recuperación.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="Nueva contraseña"
      subtitle="Ingresá tu nueva contraseña"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 text-rose-400 text-sm border border-rose-500/20">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-300">Nueva Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-slate-300">Confirmar Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium bg-gradient-to-r from-[#00C7D9] to-[#00A8BD] hover:from-[#00A8BD] hover:to-[#0097A8] text-white shadow-lg shadow-[#00C7D9]/20" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Restableciendo...
            </>
          ) : (
            "Restablecer contraseña"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}