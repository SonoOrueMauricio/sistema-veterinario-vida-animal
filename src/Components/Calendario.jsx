import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

function Calendario({ eventos }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}

        initialView="timeGridWeek" 

        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek'
        }}

        events={eventos}

        eventClick={(info) => {
            alert(
              `Mascota: ${info.event.title}
              Fecha: ${new Date(info.event.start).toLocaleString()}`
              )
        }}

        height="auto"
      />

    </div>
  )
}

export default Calendario