import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * BACKUP AUTOMÁTICO DEL SISTEMA
 * Genera backup completo de la base de datos y archivos
 * Se ejecuta semanalmente vía automatización
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar que es llamado por admin o automatización
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      isAuthorized = user?.role === 'admin' || user?.role === 'super_admin';
    } catch {
      isAuthorized = true; // Llamado desde automatización
    }

    if (!isAuthorized) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { backup_type } = await req.json();
    const type = backup_type || 'full'; // full | incremental | entities_only

    console.log(`Iniciando backup ${type}...`);

    const backupData = {
      timestamp: new Date().toISOString(),
      backup_type: type,
      entities: {},
      stats: {
        total_records: 0,
        total_size_bytes: 0,
        entities_count: 0
      }
    };

    // Lista de entidades a respaldar
    const entitiesToBackup = [
      'Client', 'Document', 'Invoice', 'Task', 'TaxFiling',
      'Employee', 'Payslip', 'AccountEntry', 'TreasuryTransaction',
      'TaxDeadline', 'IIBBCoefficient', 'CorporateRecord', 'Notification',
      'AuditLog'
    ];

    // Exportar cada entidad
    for (const entityName of entitiesToBackup) {
      try {
        const records = await base44.asServiceRole.entities[entityName].list('-created_date', 10000);
        
        backupData.entities[entityName] = {
          count: records.length,
          data: records,
          exported_at: new Date().toISOString()
        };

        backupData.stats.total_records += records.length;
        backupData.stats.entities_count++;
        
        console.log(`${entityName}: ${records.length} registros`);
      } catch (error) {
        console.error(`Error exportando ${entityName}:`, error.message);
        backupData.entities[entityName] = {
          error: error.message,
          count: 0
        };
      }
    }

    // Calcular tamaño estimado
    backupData.stats.total_size_bytes = JSON.stringify(backupData.entities).length;

    // Guardar backup en storage privado
    const backupFileName = `backup_${type}_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    
    try {
      const file = new File([JSON.stringify(backupData, null, 2)], backupFileName, {
        type: 'application/json'
      });
      
      const uploadResult = await base44.asServiceRole.integrations.Core.UploadPrivateFile({
        file: await file.arrayBuffer()
      });

      backupData.backup_file_uri = uploadResult.file_uri;
      backupData.backup_status = 'completed';
      
      console.log(`Backup completado: ${uploadResult.file_uri}`);
    } catch (error) {
      console.error('Error subiendo backup:', error.message);
      backupData.backup_status = 'failed';
      backupData.backup_error = error.message;
    }

    // Crear registro de backup
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'ai_run',
        description: `Backup ${type} realizado automáticamente`,
        entity_type: 'SystemBackup',
        metadata: JSON.stringify({
          backup_type: type,
          total_records: backupData.stats.total_records,
          status: backupData.backup_status,
          file_uri: backupData.backup_file_uri
        })
      });
    } catch (error) {
      console.error('Error logueando backup:', error.message);
    }

    return Response.json({
      success: backupData.backup_status === 'completed',
      backup_info: {
        timestamp: backupData.timestamp,
        type: backupData.backup_type,
        total_records: backupData.stats.total_records,
        entities_count: backupData.stats.entities_count,
        size_mb: (backupData.stats.total_size_bytes / 1024 / 1024).toFixed(2),
        file_uri: backupData.backup_file_uri,
        status: backupData.backup_status
      }
    });

  } catch (error) {
    console.error('Error en backup:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});