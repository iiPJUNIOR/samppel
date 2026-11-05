param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("list", "create", "restore", "diff")]
    [string]$Action = "list",

    [Parameter(Mandatory=$false)]
    [string]$PointName = "",

    [Parameter(Mandatory=$false)]
    [string]$SingleFile = "",

    [Parameter(Mandatory=$false)]
    [string[]]$Files = @(),

    [Parameter(Mandatory=$false)]
    [string]$Description = ""
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = Split-Path -Parent $PSScriptRoot

function Show-RestorePoints {
    Write-Output "=================================================================="
    Write-Output " PONTOS DE RESTAURACAO DISPONIVEIS - SAMPPEL"
    Write-Output "=================================================================="
    $dirs = Get-ChildItem -Path $WorkspaceRoot -Directory -Filter "backup_*" | Sort-Object Name -Descending
    if ($dirs.Count -eq 0) {
        Write-Output "Nenhum ponto de restauracao encontrado."
        return
    }
    foreach ($d in $dirs) {
        $allFiles = Get-ChildItem -Path $d.FullName -Recurse -File | Where-Object { $_.Name -ne "manifest.json" }
        $manifestPath = Join-Path $d.FullName "manifest.json"
        $desc = "Backup estrutural de arquivos"
        if (Test-Path $manifestPath) {
            try {
                $m = Get-Content $manifestPath -Raw | ConvertFrom-Json
                if ($m.description) { $desc = $m.description }
            } catch {}
        }
        Write-Output ""
        Write-Output "-> ID: $($d.Name)"
        Write-Output "   Data: $($d.CreationTime.ToString('yyyy-MM-dd HH:mm:ss'))"
        Write-Output "   Arquivos protegidos: $($allFiles.Count)"
        Write-Output "   Descricao: $desc"
        foreach ($f in ($allFiles | Select-Object -First 8)) {
            $rel = $f.FullName.Substring($d.FullName.Length + 1).Replace('\', '/')
            Write-Output "     - $rel"
        }
        if ($allFiles.Count -gt 8) {
            Write-Output "     ... (+$($allFiles.Count - 8) arquivos)"
        }
    }
    Write-Output "=================================================================="
}

function New-RestorePoint {
    if ([string]::IsNullOrWhiteSpace($PointName)) {
        throw "Informe -PointName (ex: backup_20261105_minha_alteracao)"
    }
    if ($Files.Count -eq 0) {
        throw "Informe a lista de arquivos em -Files @('src/...', ...)"
    }
    $targetDir = Join-Path $WorkspaceRoot $PointName
    if (!(Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }

    $manifestEntries = @()
    foreach ($relFile in $Files) {
        $srcPath = Join-Path $WorkspaceRoot $relFile
        if (!(Test-Path $srcPath)) {
            Write-Warning "Arquivo nao encontrado (ignorado): $relFile"
            continue
        }
        $destPath = Join-Path $targetDir $relFile
        $destParent = Split-Path $destPath -Parent
        if (!(Test-Path $destParent)) {
            New-Item -ItemType Directory -Path $destParent -Force | Out-Null
        }
        Copy-Item -Path $srcPath -Destination $destPath -Force
        $hash = (Get-FileHash -Path $srcPath -Algorithm SHA256).Hash
        $manifestEntries += [PSCustomObject]@{
            file = $relFile.Replace('\', '/')
            sha256 = $hash
        }
    }

    $manifest = [PSCustomObject]@{
        pointName = $PointName
        createdAt = (Get-Date).ToString("o")
        description = $Description
        filesCount = $manifestEntries.Count
        files = $manifestEntries
    }
    $manifest | ConvertTo-Json -Depth 5 | Set-Content -Path (Join-Path $targetDir "manifest.json") -Encoding UTF8
    Write-Output "[OK] Ponto de restauracao '$PointName' criado com $($manifestEntries.Count) arquivo(s)."
}

function Restore-FromPoint {
    if ([string]::IsNullOrWhiteSpace($PointName)) {
        throw "Informe -PointName do ponto de restauracao que deseja restaurar."
    }
    $sourceDir = Join-Path $WorkspaceRoot $PointName
    if (!(Test-Path $sourceDir)) {
        throw "Ponto de restauracao nao encontrado: $PointName"
    }

    if (![string]::IsNullOrWhiteSpace($SingleFile)) {
        $bkpFile = Join-Path $sourceDir $SingleFile
        if (!(Test-Path $bkpFile)) {
            throw "O arquivo '$SingleFile' nao existe dentro do ponto '$PointName'."
        }
        $destFile = Join-Path $WorkspaceRoot $SingleFile
        Copy-Item -Path $bkpFile -Destination $destFile -Force
        Write-Output "[ROLLBACK PARCIAL CONCLUIDO] Arquivo '$SingleFile' restaurado a partir de '$PointName'."
        return
    }

    $allFiles = Get-ChildItem -Path $sourceDir -Recurse -File | Where-Object { $_.Name -ne "manifest.json" }
    foreach ($f in $allFiles) {
        $rel = $f.FullName.Substring($sourceDir.Length + 1)
        $dest = Join-Path $WorkspaceRoot $rel
        $destParent = Split-Path $dest -Parent
        if (!(Test-Path $destParent)) {
            New-Item -ItemType Directory -Path $destParent -Force | Out-Null
        }
        Copy-Item -Path $f.FullName -Destination $dest -Force
    }
    Write-Output "[ROLLBACK TOTAL CONCLUIDO] $($allFiles.Count) arquivo(s) restaurados a partir de '$PointName'."
}

switch ($Action) {
    "list"    { Show-RestorePoints }
    "create"  { New-RestorePoint }
    "restore" { Restore-FromPoint }
}

