#include <stdbool.h>
#include <tea.h>
#include <micro.h>

/* Browser-only ABI glue to handle micro and tea state */
static tea_State* WT;
static char wasm_name[] = "micro";
static char wasm_path[] = ".";
static char* wasm_argv[] = {wasm_name, wasm_path, NULL};

void micro_wasm_open(void)
{
    WT = micro_open(2, wasm_argv);
}

int micro_wasm_frame(void)
{
    if(!spxeStep()) return 0;
    micro_run(WT);
    return 1;
}

void micro_wasm_close(void)
{
    if(WT)
    {
        micro_close(WT);
        WT = NULL;
    }
}
