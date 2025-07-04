import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import {
  ArrowUpRight,
  CheckCircle2,
  Shield,
  Users,
  Zap,
  Ticket,
  BarChart3,
  MessageSquare,
  Clock,
} from "lucide-react";
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Complete Support Solution
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage customer support efficiently with
              dedicated portals for clients and support teams.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Ticket className="w-6 h-6" />,
                title: "Ticket Management",
                description:
                  "Create, track, and resolve support tickets efficiently",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Dual Portals",
                description:
                  "Separate interfaces for clients and support staff",
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Analytics Dashboard",
                description: "Track performance with detailed insights",
              },
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: "Real-time Updates",
                description: "Instant notifications and status updates",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Powerful Features for Every User
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Designed with both clients and support teams in mind, ASSA
              provides the tools you need for exceptional customer service.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Client Features */}
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-center mb-6">
                <Users className="w-8 h-8 text-blue-600 mr-3" />
                <h3 className="text-2xl font-semibold">For Clients</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Submit and track support tickets easily</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Real-time status updates and notifications</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>View complete ticket history and comments</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Secure client portal with company branding</span>
                </li>
              </ul>
            </div>

            {/* Staff Features */}
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-center mb-6">
                <Shield className="w-8 h-8 text-purple-600 mr-3" />
                <h3 className="text-2xl font-semibold">For Support Teams</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Manage all tickets from a unified dashboard</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Filter and prioritize tickets efficiently</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Add internal notes and collaborate with team</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Analytics and performance metrics</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-blue-100">Tickets Resolved</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Companies Trust Us</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2 Min</div>
              <div className="text-blue-100">Average Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Transform Your Support Operations
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join companies worldwide who have streamlined their customer support
            with ASSA's comprehensive ticket management system.
          </p>
          <a
            href="/sign-up"
            className="inline-flex items-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Your Free Trial
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
