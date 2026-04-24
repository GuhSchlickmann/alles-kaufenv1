using System;
using System.Windows.Forms;
using System.Diagnostics;
using System.Drawing;

public class AllesKaufen : Form {
    public AllesKaufen() {
        this.Text = "Alles Kaufen - Gestão de Compras";
        this.Width = 1280;
        this.Height = 800;
        this.WindowState = FormWindowState.Maximized;
        
        // Tenta carregar o ícone na janela também
        try {
            this.Icon = new Icon("app_icon.ico");
        } catch {}

        Process.Start("msedge", "--app=https://alles-kaufen-system.onrender.com");
        
        Timer timer = new Timer();
        timer.Interval = 1000;
        timer.Tick += (s, e) => { Application.Exit(); };
        timer.Start();
    }
    [STAThread]
    public static void Main() {
        Application.Run(new AllesKaufen());
    }
}
