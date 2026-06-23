

from dataclasses import dataclass, field
from typing import List
import datetime

CORRIDOR_MULTIPLIER = {
    'mysore road'    : 1.3,
    'bellary road 1' : 1.3,
    'bellary road 2' : 1.3,
    'tumkur road'    : 1.15,
    'hosur road'     : 1.15,
    'orr north 1'    : 1.15,
    'orr north 2'    : 1.15,
    'orr south 1'    : 1.15,
    'orr south 2'    : 1.15,
    'old madras road': 1.1,
    'magadi road'    : 1.1,
}

DIVERSION_ROUTES = {
    'mysore road'    : ['NICE Road', 'Magadi Road', 'Kanakapura Road'],
    'bellary road 1' : ['Hebbal Flyover alternate', 'ORR North 1', 'Thanisandra Road'],
    'bellary road 2' : ['Ballari Road service road', 'ORR North 2'],
    'tumkur road'    : ['Peenya alternate', 'NICE Road connector'],
    'hosur road'     : ['Sarjapur Road', 'ORR South 1', 'Bannerghatta Road'],
    'old madras road': ['Whitefield alternate', 'ORR East', 'Marathahalli Bridge'],
    'magadi road'    : ['Chord Road', 'Rajajinagar alternate'],
    'orr north 1'    : ['Bellary Road service road', 'Thanisandra Road'],
    'orr south 1'    : ['Sarjapur Road', 'Hosur Road service road'],
}

BASE_RESOURCES = {
    0: {'officers': (2, 3),   'barricades': (0, 1),  'response_min': 30, 'label': 'Low'},
    1: {'officers': (4, 6),   'barricades': (2, 3),  'response_min': 20, 'label': 'Moderate'},
    2: {'officers': (8, 12),  'barricades': (4, 6),  'response_min': 10, 'label': 'High'},
    3: {'officers': (15, 20), 'barricades': (8, 12), 'response_min': 0,  'label': 'Critical'},
}

SEVERITY_COLORS = {
    0: '#0A5C36',
    1: '#8A5A00',
    2: '#993C1D',
    3: '#4A0000',
}

DURATION_FALLBACK = {0: 49.0, 1: 42.8, 2: 43.5, 3: 53.2}


@dataclass
class ResourcePlan:
    severity_class : int
    severity_label : str
    impact_score   : float
    officers_min   : int
    officers_max   : int
    barricades_min : int
    barricades_max : int
    response_time  : str
    diversion      : List[str]
    timeline       : dict
    shift_plan     : str
    color          : str


def build_plan(severity_class, impact_score, corridor, duration_min):
    base = BASE_RESOURCES[severity_class]
    mult = CORRIDOR_MULTIPLIER.get(corridor.lower().strip(), 1.0)

    off_min = round(base['officers'][0] * mult)
    off_max = round(base['officers'][1] * mult)
    bar_min = base['barricades'][0]
    bar_max = base['barricades'][1]

    r = base['response_min']
    resp = ('Immediate' if r == 0 else
            '< 10 min' if r <= 10 else
            '< 20 min' if r <= 20 else '< 30 min')

    routes = DIVERSION_ROUTES.get(corridor.lower().strip(),
                                  ['Use alternate local roads'])

    now       = datetime.datetime.now()
    peak_min  = round(duration_min * 0.4)
    clear_min = round(duration_min)

    timeline = {
        'start'    : now.strftime('%H:%M'),
        'peak'     : (now + datetime.timedelta(minutes=peak_min)).strftime('%H:%M'),
        'clearance': (now + datetime.timedelta(minutes=clear_min)).strftime('%H:%M'),
        'peak_min' : peak_min,
        'clear_min': clear_min,
    }

    if duration_min < 60:
        shift_plan = 'Single shift sufficient'
    elif duration_min < 180:
        shift_plan = f'Overlap shift at T+{round(duration_min * 0.6)} min'
    else:
        shift_plan = f'Two full shifts — handover at T+{round(duration_min * 0.5)} min'

    return ResourcePlan(
        severity_class=severity_class,
        severity_label=base['label'],
        impact_score=round(impact_score, 1),
        officers_min=off_min,
        officers_max=off_max,
        barricades_min=bar_min,
        barricades_max=bar_max,
        response_time=resp,
        diversion=routes,
        timeline=timeline,
        shift_plan=shift_plan,
        color=SEVERITY_COLORS[severity_class],
    )